# Supabase Migrations for Stories 2.10 & 2.11

## Overview

These migrations add support for:
- **Story 2.10**: Flyer upload persistence with user linking (7-day expiration)
- **Story 2.11**: Recommendation caching per user (30-day TTL)

## Migration Files

1. **20260215000001_create_flyer_uploads_table.sql**
   - Creates `flyer_uploads` table to track uploaded flyers
   - Stores metadata: user_id, storage_path, event_data, expires_at
   - Includes RLS policies for user isolation
   - Auto-cleanup function for expired uploads

2. **20260215000002_create_storage_bucket_flyers.sql**
   - Creates Supabase Storage bucket `flyers`
   - Configures 10MB file size limit
   - Restricts to JPEG, PNG, PDF formats
   - Storage policies for user-specific access

3. **20260215000003_create_recommendations_cache_table.sql**
   - Creates `recommendations_cache` table for caching API results
   - 30-day TTL with automatic expiration
   - Event hash-based cache keys for deduplication
   - Last accessed tracking for LRU cleanup

## How to Apply Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Verify migrations
supabase db diff
```

### Option 2: Supabase Dashboard (Manual)

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy the contents of each migration file
3. Paste and execute in order:
   - `20260215000001_create_flyer_uploads_table.sql`
   - `20260215000002_create_storage_bucket_flyers.sql`
   - `20260215000003_create_recommendations_cache_table.sql`
4. Verify tables exist in the Table Editor

### Option 3: Direct SQL Execution

```bash
# Using psql (replace with your connection string)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20260215000001_create_flyer_uploads_table.sql

psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20260215000002_create_storage_bucket_flyers.sql

psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/20260215000003_create_recommendations_cache_table.sql
```

## Verification

After applying migrations, verify in Supabase Dashboard:

### Tables Created
- ✅ `public.flyer_uploads` - Flyer metadata table
- ✅ `public.recommendations_cache` - Recommendations cache table

### Storage Bucket Created
- ✅ `flyers` bucket in Storage section (10MB limit, not public)

### Row Level Security Enabled
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data

## Database Schema

### `flyer_uploads` Table
```sql
Column          | Type         | Description
----------------|--------------|------------------------------------
id              | UUID         | Primary key
user_id         | TEXT         | Clerk user ID
storage_path    | TEXT         | Path in Storage (flyers/{user_id}/filename)
file_name       | TEXT         | Original filename
file_size       | INTEGER      | File size in bytes (max 10MB)
mime_type       | TEXT         | image/jpeg, image/png, application/pdf
event_data      | JSONB        | Extracted event details from AI
created_at      | TIMESTAMPTZ  | Upload timestamp
expires_at      | TIMESTAMPTZ  | Expiration (7 days after upload)
```

### `recommendations_cache` Table
```sql
Column          | Type         | Description
----------------|--------------|------------------------------------
id              | UUID         | Primary key
user_id         | TEXT         | Clerk user ID
event_hash      | TEXT         | MD5 hash of event details (cache key)
event_data      | JSONB        | Original event data
zones           | JSONB        | Array of zone recommendations
created_at      | TIMESTAMPTZ  | Cache entry created timestamp
expires_at      | TIMESTAMPTZ  | Expiration (30 days after creation)
last_accessed_at| TIMESTAMPTZ  | Last cache hit timestamp
```

## Usage Examples

### Story 2.10: Flyer Upload Persistence

**Backend API Endpoint (POST /api/flyers/upload):**
```python
# After successful Supabase Storage upload
storage_path = f"flyers/{user_id}/{file_id}.jpg"

# Insert metadata into flyer_uploads table
supabase.table('flyer_uploads').insert({
    'user_id': user_id,
    'storage_path': storage_path,
    'file_name': original_filename,
    'file_size': file_size_bytes,
    'mime_type': 'image/jpeg',
    'event_data': extracted_event_details,
    # expires_at auto-set to 7 days from now
}).execute()
```

**Backend API Endpoint (GET /api/flyers/history):**
```python
# Fetch user's upload history
result = supabase.table('flyer_uploads') \
    .select('*') \
    .eq('user_id', user_id) \
    .gt('expires_at', 'now()') \
    .order('created_at', desc=True) \
    .execute()

return result.data
```

### Story 2.11: Recommendation Caching

**Backend API Endpoint (POST /api/recommendations/top):**
```python
# Generate cache key from event details
event_hash = hashlib.md5(
    f"{event_name}|{event_date}|{event_time}|{venue_lat}|{venue_lon}|{','.join(target_audience)}|{event_type}".encode()
).hexdigest()

# Check cache first
cache_result = supabase.table('recommendations_cache') \
    .select('*') \
    .eq('user_id', user_id) \
    .eq('event_hash', event_hash) \
    .gt('expires_at', 'now()') \
    .execute()

if cache_result.data:
    # Cache hit! Update last_accessed_at
    supabase.table('recommendations_cache') \
        .update({'last_accessed_at': 'now()'}) \
        .eq('id', cache_result.data[0]['id']) \
        .execute()

    return cache_result.data[0]['zones']

# Cache miss - generate recommendations via API
zones = generate_recommendations(event_data)

# Store in cache
supabase.table('recommendations_cache').insert({
    'user_id': user_id,
    'event_hash': event_hash,
    'event_data': event_data,
    'zones': zones,
    # expires_at auto-set to 30 days from now
}).execute()

return zones
```

## Maintenance

### Manual Cleanup (if pg_cron not available)

Run these functions manually if automatic cleanup is not configured:

```sql
-- Delete expired flyers
SELECT delete_expired_flyers();

-- Delete expired cache entries
SELECT delete_expired_cache();
```

### Enable Automatic Cleanup (pg_cron)

If your Supabase instance has `pg_cron` enabled, uncomment the cron schedules in the migration files:

```sql
-- In 20260215000001_create_flyer_uploads_table.sql
SELECT cron.schedule(
  'delete-expired-flyers',
  '0 2 * * *', -- 2 AM daily
  'SELECT delete_expired_flyers();'
);

-- In 20260215000003_create_recommendations_cache_table.sql
SELECT cron.schedule(
  'delete-expired-cache',
  '0 3 * * *', -- 3 AM daily
  'SELECT delete_expired_cache();'
);
```

## Rollback

To rollback these migrations:

```sql
-- Rollback Story 2.11 (Recommendations Cache)
DROP TABLE IF EXISTS public.recommendations_cache CASCADE;
DROP FUNCTION IF EXISTS generate_event_hash CASCADE;
DROP FUNCTION IF EXISTS delete_expired_cache CASCADE;
DROP FUNCTION IF EXISTS update_cache_last_accessed CASCADE;

-- Rollback Story 2.10 (Flyer Uploads)
DROP TABLE IF EXISTS public.flyer_uploads CASCADE;
DROP FUNCTION IF EXISTS delete_expired_flyers CASCADE;

-- Delete Storage bucket (via Dashboard or API)
-- DELETE FROM storage.buckets WHERE id = 'flyers';
```

## Security Notes

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ Users can only access their own data
- ✅ Storage bucket is **not public** (requires authentication)
- ✅ File size limits enforced (10MB max)
- ✅ MIME type restrictions (JPEG, PNG, PDF only)
- ✅ Automatic expiration prevents data buildup

## Testing

### Test Flyer Upload
```bash
# Upload a test flyer
curl -X POST http://localhost:8000/api/flyers/upload \
  -H "X-Clerk-User-Id: user_test123" \
  -F "file=@test-flyer.jpg"

# Verify in database
SELECT * FROM flyer_uploads WHERE user_id = 'user_test123';
```

### Test Recommendations Cache
```bash
# Generate recommendations (should cache)
curl -X POST http://localhost:8000/api/recommendations/top \
  -H "X-Clerk-User-Id: user_test123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","date":"2026-03-15",...}'

# Verify cache entry
SELECT event_hash, zones FROM recommendations_cache WHERE user_id = 'user_test123';

# Make same request again (should hit cache)
curl -X POST http://localhost:8000/api/recommendations/top \
  -H "X-Clerk-User-Id: user_test123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","date":"2026-03-15",...}'
```

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify RLS policies: Dashboard → Authentication → Policies
3. Check Storage bucket settings: Dashboard → Storage
4. Ensure Clerk JWT contains valid `sub` claim for user_id

---

**Migration Status:**
- ✅ Ready to apply
- ✅ Tested with Supabase v2.x
- ✅ RLS policies configured
- ✅ Automatic cleanup included
