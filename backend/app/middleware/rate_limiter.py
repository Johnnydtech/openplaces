"""
Rate Limiting Middleware for OpenPlaces API
Prevents abuse by limiting requests per user/IP
"""

import time
import logging
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    In-memory rate limiter with sliding window
    For production, use Redis for distributed rate limiting
    """

    def __init__(self):
        # Store: {key: [(timestamp, count), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 3600  # Clean old entries every hour
        self.last_cleanup = time.time()

    def _cleanup_old_entries(self):
        """Remove expired entries to prevent memory bloat"""
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            cutoff_time = current_time - 86400  # Keep last 24 hours
            for key in list(self.requests.keys()):
                self.requests[key] = [
                    (ts, count) for ts, count in self.requests[key]
                    if ts > cutoff_time
                ]
                if not self.requests[key]:
                    del self.requests[key]
            self.last_cleanup = current_time

    def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit

        Args:
            key: Unique identifier (user_id, IP, etc.)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            (allowed: bool, remaining: int, reset_time: int)
        """
        current_time = time.time()
        cutoff_time = current_time - window_seconds

        # Clean up periodically
        self._cleanup_old_entries()

        # Filter requests within window
        recent_requests = [
            (ts, count) for ts, count in self.requests[key]
            if ts > cutoff_time
        ]

        # Count total requests in window
        request_count = sum(count for _, count in recent_requests)

        # Check limit
        allowed = request_count < max_requests
        remaining = max(0, max_requests - request_count - 1)

        # Add current request if allowed
        if allowed:
            recent_requests.append((current_time, 1))
            self.requests[key] = recent_requests

        # Calculate reset time (when oldest request expires)
        reset_time = int(cutoff_time + window_seconds) if recent_requests else int(current_time)

        return allowed, remaining, reset_time


# Global rate limiter instance
rate_limiter = RateLimiter()


# Rate limit tiers (requests per time window)
RATE_LIMITS = {
    # Per-IP limits (anonymous users)
    "ip_per_minute": (10, 60),  # 10 requests per minute
    "ip_per_hour": (100, 3600),  # 100 requests per hour
    "ip_per_day": (500, 86400),  # 500 requests per day

    # Per-user limits (authenticated users - more generous)
    "user_per_minute": (20, 60),  # 20 requests per minute
    "user_per_hour": (300, 3600),  # 300 requests per hour
    "user_per_day": (2000, 86400),  # 2000 requests per day

    # Expensive operations (AI analysis)
    "analyze_per_hour": (10, 3600),  # 10 AI analyses per hour
    "analyze_per_day": (50, 86400),  # 50 AI analyses per day
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting
    """

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/", "/api/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Get user identifier (Clerk user ID from header or IP)
        user_id = request.headers.get("x-clerk-user-id")
        client_ip = request.client.host

        # Determine rate limit key
        if user_id:
            identifier = f"user:{user_id}"
            limits = [
                ("user_per_minute", RATE_LIMITS["user_per_minute"]),
                ("user_per_hour", RATE_LIMITS["user_per_hour"]),
                ("user_per_day", RATE_LIMITS["user_per_day"]),
            ]
        else:
            identifier = f"ip:{client_ip}"
            limits = [
                ("ip_per_minute", RATE_LIMITS["ip_per_minute"]),
                ("ip_per_hour", RATE_LIMITS["ip_per_hour"]),
                ("ip_per_day", RATE_LIMITS["ip_per_day"]),
            ]

        # Add special limits for expensive endpoints
        if "/api/analyze" in request.url.path:
            limits.extend([
                ("analyze_per_hour", RATE_LIMITS["analyze_per_hour"]),
                ("analyze_per_day", RATE_LIMITS["analyze_per_day"]),
            ])
            identifier_analyze = f"{identifier}:analyze"
        else:
            identifier_analyze = None

        # Check all applicable rate limits
        for limit_name, (max_requests, window_seconds) in limits:
            check_key = identifier_analyze if "analyze" in limit_name and identifier_analyze else identifier

            allowed, remaining, reset_time = rate_limiter.check_rate_limit(
                f"{check_key}:{limit_name}",
                max_requests,
                window_seconds
            )

            if not allowed:
                # Rate limit exceeded
                retry_after = reset_time - int(time.time())
                logger.warning(
                    f"Rate limit exceeded: {limit_name} for {identifier} "
                    f"on {request.url.path}"
                )

                from starlette.responses import JSONResponse
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "Rate limit exceeded",
                        "limit": limit_name,
                        "retry_after": retry_after,
                        "message": f"Too many requests. Please try again in {retry_after} seconds."
                    },
                    headers={
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": str(remaining),
                        "X-RateLimit-Reset": str(reset_time),
                        "Retry-After": str(retry_after),
                    }
                )

        # Request allowed - add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = "See docs for limits"
        return response
