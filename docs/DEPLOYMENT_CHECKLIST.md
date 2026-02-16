# 🚀 Abuse Prevention Deployment Checklist

## 1. Database Migration (Supabase)

### Run the Usage Tracking Migration

```bash
# Option A: Supabase Dashboard (Recommended)
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Navigate to SQL Editor
# 4. Copy contents of backend/supabase_migration_usage_logs.sql
# 5. Paste and execute

# Option B: Supabase CLI
supabase db push --file backend/supabase_migration_usage_logs.sql
```

###Verify Migration

```sql
-- Check if table exists
SELECT * FROM usage_logs LIMIT 1;

-- Check if view exists
SELECT * FROM daily_usage_summary LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'usage_logs';
```

## 2. Backend Deployment

### Install Dependencies (if any new ones)

```bash
cd backend
pip install -r requirements.txt
```

### Test Locally First

```bash
# Start backend
python app/main.py

# Test rate limiting (should get 429 on 11th request)
for i in {1..11}; do
  curl -X POST http://localhost:8000/api/analyze \
    -H "x-clerk-user-id: test_user_123" \
    -F "file=@test_flyer.jpg"
done

# Test authentication requirement
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@test_flyer.jpg"
# Should return 401 Unauthorized
```

### Deploy to Production

```bash
# If using Railway/Render/Heroku
git push production main

# If using Docker
docker build -t openplaces-backend .
docker push your-registry/openplaces-backend:latest
```

## 3. Frontend Deployment

### Test Locally First

```bash
cd openplaces-frontend
npm run dev

# Test scenarios:
# 1. Try to upload without signing in → Should show "Please sign in"
# 2. Sign in and upload → Should work
# 3. Upload 11 times quickly → Should show rate limit error
# 4. Upload inappropriate image → Should show content violation error
```

### Deploy to Vercel

```bash
# Option A: Automatic (push to main)
git push origin main

# Option B: Manual
cd openplaces-frontend
vercel --prod
```

## 4. Environment Variables

### Verify All Keys Are Set

**Backend (.env):**
- ✅ `OPENAI_API_KEY` - For AI analysis and content moderation
- ✅ `SUPABASE_URL` - For usage tracking database
- ✅ `SUPABASE_SERVICE_KEY` - For database access
- ✅ `CLERK_WEBHOOK_SECRET` - For user authentication
- ✅ All other existing keys

**Frontend (.env.local):**
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - For Clerk auth
- ✅ `NEXT_PUBLIC_API_URL` - Points to production backend
- ✅ All other existing keys

## 5. Post-Deployment Verification

### Test All Protection Layers

#### 1. Rate Limiting ⏱️
```bash
# Send 11 requests quickly
for i in {1..11}; do
  curl -X POST https://your-api.com/api/analyze \
    -H "x-clerk-user-id: your_test_user" \
    -F "file=@test.jpg"
  sleep 0.5
done

# Expected: 10 succeed, 11th returns 429 with Retry-After header
```

#### 2. Daily Limits 📊
```bash
# Check if usage tracking is working
curl https://your-api.com/api/user/stats \
  -H "x-clerk-user-id: your_test_user"

# Should return usage stats
```

#### 3. Content Moderation 🔞
```bash
# Upload test image
curl -X POST https://your-api.com/api/analyze \
  -H "x-clerk-user-id: your_test_user" \
  -F "file=@appropriate_image.jpg"

# Should succeed with 200
```

#### 4. Authentication 🔐
```bash
# Try without user ID
curl -X POST https://your-api.com/api/analyze \
  -F "file=@test.jpg"

# Should return 401 Unauthorized
```

### Monitor Usage

```sql
-- Check usage logs in Supabase
SELECT * FROM usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check daily summary
SELECT * FROM daily_usage_summary
WHERE usage_date = CURRENT_DATE
ORDER BY operation_count DESC;

-- Find users hitting limits
SELECT user_id, operation_type, COUNT(*) as count
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, operation_type
HAVING COUNT(*) > 40
ORDER BY count DESC;

-- Estimate costs
SELECT
  operation_type,
  COUNT(*) as operations,
  SUM(cost_estimate) as total_cost_usd
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY operation_type;
```

## 6. Frontend User Experience

### Test User Flows

1. **Anonymous User:**
   - Visit homepage → Should see landing page content
   - Try to upload → Should see "Please sign in" message
   - Click sign in → Clerk auth flow
   - After sign in → Can now upload

2. **Authenticated User:**
   - Upload flyer → Should work
   - Upload 11 times quickly → Should see rate limit message
   - Wait for rate limit to reset → Can upload again
   - Upload 51 times in a day → Should see daily limit message

3. **Error Messages:**
   - Rate limit: "Too many requests. Please try again in X seconds."
   - Daily limit: "You've reached your daily limit of 50 AI analyses. Please try again tomorrow."
   - Content violation: "This image contains inappropriate content and cannot be processed."
   - Auth required: "Please sign in to analyze flyers"

## 7. Monitoring & Alerts

### Set Up Monitoring

1. **Track 429 Errors:**
   - Monitor rate limit hits
   - Alert if >100 429s per hour (possible attack)

2. **Track Usage Costs:**
   - Daily cost summary from `usage_logs`
   - Alert if daily cost >$50 (unexpected spike)

3. **Track Content Violations:**
   - Count flagged images per day
   - Alert if >10 violations per day (possible abuse pattern)

4. **Track Authentication Failures:**
   - Count 401 errors
   - Alert if spike detected (auth system issue)

### Example Monitoring Queries

```sql
-- Rate limit violations today
SELECT COUNT(*) as rate_limit_hits
FROM usage_logs
WHERE created_at > CURRENT_DATE
  AND metadata->>'rate_limited' = 'true';

-- Cost today
SELECT SUM(cost_estimate) as cost_today_usd
FROM usage_logs
WHERE created_at > CURRENT_DATE;

-- Top 10 users by usage
SELECT
  user_id,
  COUNT(*) as operations,
  SUM(cost_estimate) as total_cost
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY operations DESC
LIMIT 10;
```

## 8. Rollback Plan

### If Something Goes Wrong

1. **Backend Issues:**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push production main
   ```

2. **Database Issues:**
   ```sql
   -- Drop usage_logs table (only if necessary)
   DROP TABLE IF EXISTS usage_logs CASCADE;
   DROP VIEW IF EXISTS daily_usage_summary;
   ```

3. **Rate Limiting Too Strict:**
   ```python
   # In backend/app/middleware/rate_limiter.py
   # Temporarily increase limits:
   RATE_LIMITS = {
       "analyze_per_hour": (20, 3600),  # Increased from 10
       "analyze_per_day": (100, 86400),  # Increased from 50
   }
   ```

## 9. Success Criteria

- ✅ Backend starts without errors
- ✅ Frontend can upload flyers (when signed in)
- ✅ Rate limiting returns 429 after exceeding limits
- ✅ Daily limits enforced (50 analyses/day)
- ✅ Content moderation flags inappropriate images
- ✅ Authentication required for /api/analyze
- ✅ Usage logs being written to Supabase
- ✅ User-friendly error messages displayed
- ✅ No impact on legitimate users

## 10. Documentation

### Update README

Add to `backend/README.md`:
```markdown
## 🛡️ Abuse Prevention

OpenPlaces implements comprehensive abuse prevention:
- Rate limiting (10 analyses/hour, 50/day)
- Content moderation (OpenAI Vision)
- Authentication requirements
- Usage tracking and quotas

See [ABUSE_PREVENTION.md](../ABUSE_PREVENTION.md) for details.
```

### Update API Docs

Ensure Swagger docs (`/docs`) show:
- `x-clerk-user-id` header requirement
- 401, 429, 400 error responses
- Rate limit headers (`X-RateLimit-*`, `Retry-After`)

## 11. Communication

### Notify Users (if applicable)

If you have existing beta users:
```
📢 OpenPlaces Update - Feb 16, 2026

We've added abuse prevention to keep the service fast and fair for everyone:

✅ Free tier: 50 AI analyses per day
✅ Rate limiting to prevent spam
✅ Content moderation for safety

Sign in required for flyer analysis starting today.

Questions? Reply to this email.
```

## 12. Next Steps

### Future Improvements

- [ ] Add Redis for distributed rate limiting
- [ ] Implement paid tiers for higher limits
- [ ] Add CAPTCHA for sign-up
- [ ] IP blocking for repeated abuse
- [ ] Usage dashboard for users
- [ ] Cost alerts for admins
- [ ] Automated reporting for violations

---

**Deployment Owner:** [Your Name]
**Date:** February 16, 2026
**Estimated Downtime:** None (zero-downtime deployment)
**Rollback Time:** <5 minutes
