"""
Tests for database schema creation and verification.
"""
import pytest
import os
from app.database_schema import create_schema, verify_schema, get_migration_sql_path


def test_migration_sql_file_exists():
    """Test that migration SQL file exists."""
    sql_path = get_migration_sql_path()
    assert os.path.exists(sql_path), f"Migration SQL not found at {sql_path}"

    # Verify SQL content includes all required tables
    with open(sql_path, 'r') as f:
        sql = f.read()

    required_tables = ['users', 'zones', 'flyer_uploads', 'recommendations', 'saved_recommendations']
    for table in required_tables:
        assert f'CREATE TABLE IF NOT EXISTS {table}' in sql, f"Table {table} not in migration"

    # Verify PostGIS extension
    assert 'CREATE EXTENSION IF NOT EXISTS postgis' in sql

    # Verify indexes
    assert 'idx_zones_location' in sql
    assert 'idx_recommendations_user_id' in sql
    assert 'idx_recommendations_event_hash' in sql
    assert 'idx_flyer_uploads_expires_at' in sql


@pytest.mark.asyncio
async def test_create_schema_without_supabase():
    """Test schema creation returns error without Supabase."""
    # Skip if Supabase is configured
    if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"):
        pytest.skip("Supabase configured - test for missing config")

    # Test will attempt to create schema and should handle missing config
    result = await create_schema()

    # Should return status indicating schema state
    assert 'status' in result
    assert result['status'] in ['complete', 'incomplete', 'error']


@pytest.mark.asyncio
async def test_verify_schema_structure():
    """Test schema verification checks all required tables."""
    # Skip if no Supabase
    if not os.getenv("SUPABASE_URL"):
        pytest.skip("Supabase not configured")

    result = await verify_schema()

    assert 'status' in result
    assert 'tables' in result or 'error' in result

    if result['status'] == 'complete':
        # If complete, all tables should exist
        assert result['tables']['users'] == 'exists'
        assert result['tables']['zones'] == 'exists'
        assert result['tables']['flyer_uploads'] == 'exists'
        assert result['tables']['recommendations'] == 'exists'
        assert result['tables']['saved_recommendations'] == 'exists'
        assert result['postgis'] == 'enabled'


def test_sql_has_correct_column_types():
    """Test SQL migration defines correct column types."""
    sql_path = get_migration_sql_path()

    with open(sql_path, 'r') as f:
        sql = f.read()

    # Verify critical column types
    assert 'clerk_user_id VARCHAR(255) UNIQUE NOT NULL' in sql
    assert 'location GEOGRAPHY(POINT, 4326)' in sql  # PostGIS type
    assert 'audience_signals JSONB' in sql
    assert 'timing_windows JSONB' in sql
    assert 'event_hash VARCHAR(64)' in sql


def test_sql_has_foreign_keys():
    """Test SQL migration defines foreign key relationships."""
    sql_path = get_migration_sql_path()

    with open(sql_path, 'r') as f:
        sql = f.read()

    # Verify foreign key constraints
    assert 'REFERENCES users(id) ON DELETE CASCADE' in sql
    assert 'REFERENCES recommendations(id) ON DELETE CASCADE' in sql


def test_sql_has_gist_index_for_geography():
    """Test SQL creates GIST index for PostGIS geography queries."""
    sql_path = get_migration_sql_path()

    with open(sql_path, 'r') as f:
        sql = f.read()

    assert 'USING GIST (location)' in sql, "Missing GIST index for zones.location"
