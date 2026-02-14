# Quick Start: Database Setup

## ⚡ 5-Minute Database Setup

### Step 1: Create Supabase Project (2 minutes)
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name:** openplaces
   - **Database Password:** (choose a strong password)
   - **Region:** Choose closest to you
4. Wait for project to be ready (~1 minute)

### Step 2: Get Your Credentials (30 seconds)
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role secret** (under "Project API keys" - click "Reveal")

### Step 3: Configure Backend (30 seconds)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Database Setup (2 minutes)
1. In Supabase dashboard, go to **SQL Editor**
2. Open `backend/DATABASE_SETUP.md`
3. Copy **ALL the SQL** (Step 1 through Step 3)
4. Paste into SQL Editor
5. Click **Run**

You should see: ✅ Success message and 10 zones inserted

### Step 5: Verify (30 seconds)
```bash
cd backend
python setup_database.py --status
```

Expected output:
```
✅ Database connection successful
✅ PostGIS extension enabled
✅ users                      exists
✅ zones                      exists
   Total zones: 10
```

## ✅ You're Done!

Your database is ready. The backend can now:
- Store user data
- Query placement zones
- Save recommendations
- Handle flyer uploads

## 🐛 Troubleshooting

### "SUPABASE_URL environment variable not set"
→ Make sure you're in the `backend/` directory and `.env` file exists

### "Database connection failed"
→ Check your SUPABASE_URL and SUPABASE_SERVICE_KEY in `.env`

### "PostGIS not detected"
→ Run `CREATE EXTENSION IF NOT EXISTS postgis;` in Supabase SQL Editor

### "Connection timeout"
→ Check your internet connection and Supabase project status

## 📚 Next Steps

1. **Run tests:**
   ```bash
   cd backend
   pytest tests/test_database.py -v
   ```

2. **Check API status:**
   ```bash
   python app/main.py
   # Open http://localhost:8000/docs
   ```

3. **Continue with Story 1.7:** Configure Clerk Authentication

---

**Need detailed instructions?** See [backend/DATABASE_SETUP.md](./backend/DATABASE_SETUP.md)
