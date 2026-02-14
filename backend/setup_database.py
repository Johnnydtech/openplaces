#!/usr/bin/env python3
"""
Database setup and verification script
Stories 1.5 and 1.6: Initialize and verify Supabase database

Usage:
    python setup_database.py --check    # Verify connection only
    python setup_database.py --status   # Show detailed status
"""

import asyncio
import sys
from app.database import Database


async def check_connection():
    """Verify database connection and PostGIS availability"""
    print("Checking database connection...")
    print("-" * 50)

    result = await Database.verify_connection()

    if result["connected"]:
        print("✅ Database connection successful")
        print(f"   URL: {result['url']}")

        if result["postgis_enabled"]:
            print("✅ PostGIS extension enabled")
        else:
            print("⚠️  PostGIS extension not detected")
            print("   Run: CREATE EXTENSION IF NOT EXISTS postgis;")
    else:
        print("❌ Database connection failed")
        print(f"   Error: {result.get('error', 'Unknown error')}")
        return False

    print("-" * 50)
    return result["connected"] and result["postgis_enabled"]


async def show_status():
    """Show detailed database status and table information"""
    print("Database Status")
    print("=" * 50)

    # Connection check
    conn_result = await check_connection()

    if not conn_result:
        print("\n❌ Cannot check table status - connection failed")
        return False

    # Table existence check
    print("\nChecking required tables...")
    print("-" * 50)

    client = Database.get_client()

    tables = ["users", "zones", "flyer_uploads", "recommendations", "saved_recommendations"]

    for table_name in tables:
        try:
            # Try to select from table (will fail if doesn't exist)
            response = client.table(table_name).select("*").limit(0).execute()
            print(f"✅ {table_name:25} exists")
        except Exception as e:
            print(f"❌ {table_name:25} NOT FOUND")
            print(f"   Error: {str(e)[:60]}")

    # Zones count
    print("\nZone data:")
    print("-" * 50)
    try:
        response = client.table("zones").select("id", count="exact").execute()
        zone_count = response.count if response.count else 0
        print(f"   Total zones: {zone_count}")

        if zone_count > 0:
            # Get sample zone names
            zones_response = client.table("zones").select("name").limit(5).execute()
            if zones_response.data:
                print(f"   Sample zones:")
                for zone in zones_response.data:
                    print(f"     - {zone['name']}")
        else:
            print("   ⚠️  No zones found - run sample data insert from DATABASE_SETUP.md")

    except Exception as e:
        print(f"   ❌ Cannot query zones: {str(e)[:60]}")

    print("-" * 50)
    print("\nFor full setup instructions, see backend/DATABASE_SETUP.md")

    return True


async def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "--check":
            success = await check_connection()
            sys.exit(0 if success else 1)
        elif command == "--status":
            success = await show_status()
            sys.exit(0 if success else 1)
        else:
            print(f"Unknown command: {command}")
            print("Usage: python setup_database.py [--check | --status]")
            sys.exit(1)
    else:
        # Default: show status
        success = await show_status()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
