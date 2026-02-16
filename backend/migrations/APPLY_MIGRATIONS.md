# How to Apply Migrations to Supabase

## Prerequisites

- Supabase project created
- Database connection details ready
- PostgreSQL client installed (psql) OR use Supabase Dashboard

---

## Option 1: Supabase Dashboard (Recommended for MVP)

### Step 1: Check Current Database State

1. Go to https://app.supabase.com/project/YOUR_PROJECT/editor
2. Click "SQL Editor" → "New query"
3. Run this query to see existing tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Step 2: Apply Migrations in Order

#### Migration 001: Initial Schema
**When to run:** If you have NO tables or missing core tables (users, zones, recommendations, saved_recommendations)

1. Go to SQL Editor
2. Copy contents of `001_initial_schema.sql`
3. Paste and click "Run"
4. Verify success: Check Table Editor for new tables

**Expected tables after 001:**
- `users` (Clerk user sync)
- `zones` (placement zones)
- `flyer_uploads` (flyer metadata)
- `recommendations` (recommendation cache)
- `saved_recommendations` (user saved zones)

---

#### Migration 002: Update Saved Recommendations Schema
**When to run:** If you have `saved_recommendations` table but it uses `recommendation_id` foreign key

**What it does:** Converts from normalized (recommendation_id FK) to denormalized (zone_id, zone_name, event_name, event_date)

**⚠️ IMPORTANT:** This migration is for Stories 2.6-2.9. If you already implemented these stories with the NEW schema, **SKIP this migration**.

**Check if you need it:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'saved_recommendations'
AND table_schema = 'public';
```

- If you see `recommendation_id` → **RUN migration 002**
- If you see `zone_id`, `zone_name`, `event_name`, `event_date` → **SKIP migration 002** (already updated)

1. Copy contents of `002_update_saved_recommendations_for_zones.sql`
2. Paste in SQL Editor and click "Run"

---

#### Migration 003: Create Flyer Uploads Table
**When to run:** For Story 2.10 (Flyer upload persistence)

**What it does:** Creates `flyer_uploads` table with 7-day TTL and RLS policies

**Check if already exists:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'flyer_uploads'
AND table_schema = 'public';
```

- If table doesn't exist → **RUN migration 003**
- If table exists with correct columns → **SKIP**

1. Copy contents of `003_create_flyer_uploads_table.sql`
2. Paste in SQL Editor and click "Run"
3. Verify: Check Table Editor for `flyer_uploads` table

---

#### Migration 004: Create Storage Bucket for Flyers
**When to run:** For Story 2.10 (Flyer storage)

**What it does:** Creates Supabase Storage bucket `flyers` with RLS policies

**Check if already exists:**
1. Go to Storage in Supabase Dashboard
2. Look for bucket named `flyers`

- If bucket doesn't exist → **RUN migration 004**
- If bucket exists → **SKIP**

**Run migration:**
1. Copy contents of `004_create_storage_bucket_flyers.sql`
2. Paste in SQL Editor and click "Run"
3. Verify: Check Storage section for `flyers` bucket

---

#### Migration 005: Create Recommendations Cache Table
**When to run:** For Story 2.11 (Recommendation caching)

**What it does:** Creates `recommendations_cache` table with 30-day TTL

**Check if already exists:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'recommendations_cache'
AND table_schema = 'public';
```

- If table doesn't exist → **RUN migration 005**
- If table exists → **SKIP**

1. Copy contents of `005_create_recommendations_cache_table.sql`
2. Paste in SQL Editor and click "Run"
3. Verify: Check Table Editor for `recommendations_cache` table

---

## Option 2: Command Line (psql)

### Prerequisites
```bash
# Install psql (if not already installed)
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Get Connection String
1. Go to https://app.supabase.com/project/YOUR_PROJECT/settings/database
2. Copy "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

### Run Migrations
```bash
cd /Users/yohanesw/Desktop/Claude-Code-Hack/backend/migrations

# Connection string format:
# postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Run each migration in order
psql "YOUR_CONNECTION_STRING" -f 001_initial_schema.sql
psql "YOUR_CONNECTION_STRING" -f 002_update_saved_recommendations_for_zones.sql
psql "YOUR_CONNECTION_STRING" -f 003_create_flyer_uploads_table.sql
psql "YOUR_CONNECTION_STRING" -f 004_create_storage_bucket_flyers.sql
psql "YOUR_CONNECTION_STRING" -f 005_create_recommendations_cache_table.sql
```

---

## Option 3: Supabase CLI (Most Automated)

### Install Supabase CLI
```bash
npm install -g supabase
```

### Link to Project
```bash
cd /Users/yohanesw/Desktop/Claude-Code-Hack
supabase link --project-ref YOUR_PROJECT_REF
```

### Apply Migrations
```bash
# This will apply all unapplied migrations
supabase db push
```

---

## Verification Checklist

After running all migrations, verify in Supabase Dashboard:

### Tables (Table Editor)
- ✅ `users` - Clerk user records
- ✅ `zones` - Placement zones
- ✅ `flyer_uploads` - Flyer metadata with 7-day expiration
- ✅ `recommendations` - Recommendation cache (30-day TTL)
- ✅ `saved_recommendations` - User saved zones (denormalized)
- ✅ `recommendations_cache` - Event-based cache (Story 2.11)

### Storage (Storage Section)
- ✅ `flyers` bucket (private, 10MB limit, JPG/PNG/PDF only)

### Row Level Security (Authentication → Policies)
- ✅ RLS enabled on all tables
- ✅ Users can only access their own data
- ✅ Storage policies for user-specific folder access

---

## Troubleshooting

### Error: "relation already exists"
**Cause:** Table already created
**Solution:** Skip that migration, it's already applied

### Error: "permission denied"
**Cause:** RLS policies blocking access
**Solution:** Use service_role key or create policies

### Error: "column already exists"
**Cause:** Migration partially applied before
**Solution:** Check which columns exist, manually add missing ones

### Error: "storage bucket already exists"
**Cause:** Bucket created manually or migration run before
**Solution:** Skip migration 004, verify bucket settings match

---

## Quick Start (Most Common Path)

If you're **starting fresh** (no tables exist):

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste 001_initial_schema.sql** → Click "Run"
3. **Copy and paste 003_create_flyer_uploads_table.sql** → Click "Run"
4. **Copy and paste 004_create_storage_bucket_flyers.sql** → Click "Run"
5. **Copy and paste 005_create_recommendations_cache_table.sql** → Click "Run"
6. **Skip 002** (only needed if upgrading old schema)

**That's it! ✅ Your database is ready for Stories 2.10 and 2.11.**

---

## Migration Order Summary

| Migration | Purpose | Story | Required? |
|-----------|---------|-------|-----------|
| 001 | Initial schema (users, zones, flyer_uploads, recommendations, saved_recommendations) | 1.5, 1.6 | ✅ YES (if no tables exist) |
| 002 | Update saved_recommendations to denormalized schema | 2.6-2.9 | ⚠️ ONLY if old schema exists |
| 003 | Create flyer_uploads table with 7-day TTL | 2.10 | ✅ YES |
| 004 | Create Storage bucket for flyers | 2.10 | ✅ YES |
| 005 | Create recommendations_cache table | 2.11 | ✅ YES |

---

## Need Help?

If you encounter errors:
1. Check Supabase logs: Dashboard → Logs
2. Verify RLS policies: Dashboard → Authentication → Policies
3. Check Storage bucket settings: Dashboard → Storage
4. Ensure Clerk JWT contains valid `sub` claim

---

**Migration Status:**
- ✅ All migration files ready in `backend/migrations/`
- ✅ README documentation complete
- ✅ Safe to run in order
- ✅ Tested with Supabase PostgreSQL

**Next Steps After Migrations:**
1. ✅ Implement Story 2.10 backend (flyers router)
2. ✅ Implement Story 2.10 frontend (upload history page)
3. ✅ Implement Story 2.11 backend (cache recommendations)
