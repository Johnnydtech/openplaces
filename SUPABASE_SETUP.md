# Supabase Setup Instructions

## Story 1.5: Initialize Supabase PostgreSQL Database

### Prerequisites
- Supabase account at https://supabase.com

### Steps

#### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Project Name**: `openplaces`
   - **Database Password**: (choose a secure password)
   - **Region**: Choose closest to Arlington, VA (e.g., `us-east-1`)
4. Click "Create new project"
5. Wait 2-3 minutes for project initialization

#### 2. Enable PostGIS Extension

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Run this SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Click **Run**
5. Verify success: `Success. No rows returned`

#### 3. Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUz...` (for frontend)
   - **service_role key**: `eyJhbGciOiJIUz...` (for backend - keep secret!)

#### 4. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUz...  # service_role key
```

**Frontend** (`frontend/.env.local`):
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...  # anon public key
```

#### 5. Verify Connection

**Backend test:**
```bash
cd backend
python -m pytest tests/test_supabase_connection.py -v
```

**Frontend test:**
Open browser console at http://localhost:5173 and run:
```javascript
import { verifyConnection } from './lib/supabase';
await verifyConnection();
```

### Acceptance Criteria Verification

- ✅ Supabase project created
- ✅ PostGIS extension enabled (`CREATE EXTENSION postgis`)
- ✅ Backend connects with service key (`SUPABASE_SERVICE_KEY`)
- ✅ Frontend connects with anon key (`VITE_SUPABASE_ANON_KEY`)
- ✅ Connection verified with test query
- ✅ `@supabase/supabase-js` installed (frontend)
- ✅ `supabase` Python client installed (backend)

### Troubleshooting

**Error: "Missing Supabase configuration"**
- Ensure `.env` (backend) and `.env.local` (frontend) files exist
- Check that environment variables are correctly set
- Restart dev servers after changing .env files

**Error: "PostGIS extension not found"**
- Run SQL command in Supabase Dashboard SQL Editor
- Check Database Extensions in Settings → Database

**Connection timeout**
- Verify Supabase project URL is correct
- Check API keys match the project
- Ensure project is not paused (free tier auto-pauses after inactivity)
