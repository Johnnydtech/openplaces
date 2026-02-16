"""
Usage Tracking Service
Track API usage per user to enforce quotas and prevent abuse
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class UsageTracker:
    """Track and enforce usage limits per user"""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def log_usage(
        self,
        user_id: str,
        operation_type: str,
        cost_estimate: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log usage event for a user

        Args:
            user_id: Clerk user ID
            operation_type: Type of operation (analyze, recommend, save, etc.)
            cost_estimate: Estimated API cost in USD
            metadata: Additional metadata (file size, processing time, etc.)

        Returns:
            True if logged successfully
        """
        try:
            data = {
                "user_id": user_id,
                "operation_type": operation_type,
                "cost_estimate": cost_estimate,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            }

            result = self.supabase.table("usage_logs").insert(data).execute()

            if result.data:
                logger.info(f"Logged usage: {operation_type} for user {user_id}")
                return True
            return False

        except Exception as e:
            logger.error(f"Failed to log usage: {str(e)}")
            return False

    async def check_daily_limit(
        self,
        user_id: str,
        operation_type: str,
        daily_limit: int
    ) -> tuple[bool, int]:
        """
        Check if user has exceeded daily limit for operation type

        Args:
            user_id: Clerk user ID
            operation_type: Type of operation to check
            daily_limit: Maximum operations allowed per day

        Returns:
            (under_limit: bool, usage_count: int)
        """
        try:
            # Get count of operations in last 24 hours
            yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()

            result = self.supabase.table("usage_logs")\
                .select("*", count="exact")\
                .eq("user_id", user_id)\
                .eq("operation_type", operation_type)\
                .gte("created_at", yesterday)\
                .execute()

            usage_count = result.count or 0
            under_limit = usage_count < daily_limit

            if not under_limit:
                logger.warning(
                    f"User {user_id} exceeded daily limit for {operation_type}: "
                    f"{usage_count}/{daily_limit}"
                )

            return under_limit, usage_count

        except Exception as e:
            logger.error(f"Failed to check daily limit: {str(e)}")
            # Fail open to avoid blocking users during database issues
            return True, 0

    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get usage statistics for a user

        Args:
            user_id: Clerk user ID

        Returns:
            Dictionary with usage stats (total operations, cost, breakdown by type)
        """
        try:
            # Get all usage logs for user
            result = self.supabase.table("usage_logs")\
                .select("*")\
                .eq("user_id", user_id)\
                .execute()

            logs = result.data or []

            # Calculate stats
            total_operations = len(logs)
            total_cost = sum(log.get("cost_estimate", 0) for log in logs)

            # Breakdown by operation type
            breakdown = {}
            for log in logs:
                op_type = log.get("operation_type", "unknown")
                breakdown[op_type] = breakdown.get(op_type, 0) + 1

            # Last 24 hours
            yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
            recent_logs = [
                log for log in logs
                if log.get("created_at", "") > yesterday
            ]

            return {
                "total_operations": total_operations,
                "total_cost_usd": round(total_cost, 4),
                "operations_last_24h": len(recent_logs),
                "breakdown": breakdown,
                "first_use": logs[0].get("created_at") if logs else None,
                "last_use": logs[-1].get("created_at") if logs else None,
            }

        except Exception as e:
            logger.error(f"Failed to get user stats: {str(e)}")
            return {"error": str(e)}


# Global usage tracker instance
usage_tracker = UsageTracker()


# Usage limits per operation type (daily)
USAGE_LIMITS = {
    "analyze": 50,  # 50 AI analyses per day (free tier)
    "recommend": 200,  # 200 recommendation requests per day
    "save": 100,  # 100 saves per day
    "geocode": 100,  # 100 geocoding requests per day
}
