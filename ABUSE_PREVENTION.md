# 🛡️ Abuse Prevention System

## Overview

OpenPlaces implements multiple layers of abuse prevention to protect against:
- 💸 **Cost abuse** (expensive AI API calls)
- 🚫 **Spam/flooding** (too many requests)
- 🔞 **Inappropriate content** (malicious images)
- 📊 **Resource exhaustion** (database, bandwidth)

## Protection Layers

### 1. **Rate Limiting** ⏱️

Prevents spam and flooding attacks using sliding window rate limits.

**Limits:**
- **Anonymous users (IP-based):**
  - 10 requests/minute
  - 100 requests/hour
  - 500 requests/day

- **Authenticated users (more generous):**
  - 20 requests/minute
  - 300 requests/hour
  - 2,000 requests/day

- **AI Analysis endpoint (expensive):**
  - 10 analyses/hour
  - 50 analyses/day

**Implementation:**
- File: `backend/app/middleware/rate_limiter.py`
- Applied globally via FastAPI middleware
- Returns HTTP 429 with `Retry-After` header
- In-memory tracking (use Redis for production scale)

### 2. **Usage Tracking & Quotas** 📊

Tracks API usage per user to enforce daily limits.

**Daily Limits:**
- **AI Analysis:** 50 uploads/day (free tier)
- **Recommendations:** 200 requests/day
- **Save operations:** 100 saves/day
- **Geocoding:** 100 requests/day

**Features:**
- Cost estimation ($0.01 per AI analysis)
- Usage statistics per user
- Metadata logging (file size, confidence, etc.)
- Supabase database tracking

**Implementation:**
- File: `backend/app/services/usage_tracker.py`
- Database: `usage_logs` table (see migration SQL)
- View: `daily_usage_summary` for analytics

### 3. **Content Moderation** 🔞

Scans uploaded images for inappropriate content using OpenAI Vision API.

**Checks for:**
- Explicit sexual content
- Violence/gore
- Hate symbols
- Illegal activities
- Spam/scam content

**Implementation:**
- File: `backend/app/services/content_moderator.py`
- Uses GPT-4 Vision with moderation prompt
- Returns HTTP 400 if content flagged
- Logs violations with reason and categories

### 4. **Authentication Requirements** 🔐

Expensive operations require sign-in to prevent anonymous abuse.

**Protected endpoints:**
- `/api/analyze` - AI flyer analysis (REQUIRED)
- `/api/saved-recommendations/*` - Save/unsave (REQUIRED)
- `/api/recommendations/top` - Optional (can be opened for demos)

**Implementation:**
- Checks `x-clerk-user-id` header
- Returns HTTP 401 if missing
- Rate limits are stricter for anonymous users

### 5. **File Upload Restrictions** 📁

Validates uploaded files to prevent malicious uploads.

**Restrictions:**
- **Max file size:** 10MB
- **Allowed types:** JPG, PNG, PDF only
- **Validation:** Content-Type header check

**Implementation:**
- File: `backend/app/routes/analyze.py`
- Returns HTTP 400 for invalid files

## Database Schema

### `usage_logs` Table

```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,           -- Clerk user ID
    operation_type TEXT NOT NULL,     -- analyze, recommend, save, geocode
    cost_estimate DECIMAL(10, 6),    -- Estimated API cost ($)
    metadata JSONB,                   -- Additional data
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `user_id` (fast lookups)
- `operation_type` (filter by type)
- `created_at` (time-range queries)
- `user_id + operation_type + created_at` (composite for daily limits)

**RLS Policies:**
- Users can view their own logs
- Service role can insert/read all logs

## Deployment

### 1. Run Supabase Migration

```bash
cd backend
# Copy SQL to Supabase SQL Editor and execute
cat supabase_migration_usage_logs.sql
```

Or use Supabase CLI:
```bash
supabase db push --file supabase_migration_usage_logs.sql
```

### 2. Update Frontend (Pass User ID)

The frontend needs to pass the Clerk user ID in API requests:

```typescript
// In lib/api.ts
const headers = {
  'Content-Type': 'application/json',
  'x-clerk-user-id': userId  // Add this!
};
```

### 3. Monitor Usage

```sql
-- Check daily usage per user
SELECT * FROM daily_usage_summary
WHERE usage_date = CURRENT_DATE
ORDER BY operation_count DESC;

-- Find users exceeding limits
SELECT user_id, operation_type, COUNT(*) as count
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, operation_type
HAVING COUNT(*) > 50;

-- Total API cost estimate
SELECT SUM(cost_estimate) as total_cost_usd
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '30 days';
```

## Production Improvements

### Scale to 1000+ users:

1. **Replace in-memory rate limiter with Redis:**
   ```python
   # Use redis-py for distributed rate limiting
   import redis
   redis_client = redis.Redis(host='localhost', port=6379)
   ```

2. **Add API keys for programmatic access:**
   - Generate API keys for power users
   - Different rate limits per tier (free/paid)
   - Track usage per API key

3. **Implement circuit breaker for external APIs:**
   - Prevent cascading failures
   - Fallback gracefully when OpenAI is down

4. **Add monitoring & alerts:**
   - Track rate limit hits (Datadog, Sentry)
   - Alert on unusual patterns (sudden spike)
   - Dashboard for usage trends

5. **Add CAPTCHA for sign-up:**
   - Prevent bot account creation
   - Use Cloudflare Turnstile or reCAPTCHA

6. **IP blocking for repeated abuse:**
   - Blacklist IPs with repeated violations
   - Temporary bans (exponential backoff)

## Cost Estimates (Free Tier)

**Per user, per day:**
- 50 AI analyses × $0.01 = **$0.50/day**
- Monthly per user: **~$15/month**
- 100 users: **~$1,500/month**

**Mitigation:**
- Free tier: 10 analyses/day → **$0.10/day** → **$3/month per user**
- Paid tier: Unlimited → User pays for overages

## Testing

### Test Rate Limiting

```bash
# Send 11 requests quickly (should get 429 on 11th)
for i in {1..11}; do
  curl -X POST http://localhost:8000/api/analyze \
    -H "x-clerk-user-id: test_user_123" \
    -F "file=@test.jpg"
done
```

### Test Daily Limit

```bash
# Send 51 requests (should get 429 on 51st)
for i in {1..51}; do
  curl -X POST http://localhost:8000/api/analyze \
    -H "x-clerk-user-id: test_user_456" \
    -F "file=@test.jpg"
  sleep 1
done
```

### Test Content Moderation

```bash
# Upload inappropriate image (should get 400)
curl -X POST http://localhost:8000/api/analyze \
  -H "x-clerk-user-id: test_user_789" \
  -F "file=@inappropriate.jpg"
```

## Response Examples

### Rate Limit Exceeded (429)

```json
{
  "detail": {
    "error": "Rate limit exceeded",
    "limit": "analyze_per_hour",
    "retry_after": 3542,
    "message": "Too many requests. Please try again in 3542 seconds."
  }
}
```

Headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1708123456
Retry-After: 3542
```

### Daily Limit Exceeded (429)

```json
{
  "detail": {
    "error": "Daily limit exceeded",
    "message": "You've reached your daily limit of 50 AI analyses. Please try again tomorrow or upgrade to a paid plan.",
    "usage": 51,
    "limit": 50
  }
}
```

### Content Violation (400)

```json
{
  "detail": {
    "error": "Content policy violation",
    "message": "This image contains inappropriate content and cannot be processed.",
    "reason": "Image contains explicit sexual content",
    "categories": ["sexual", "explicit"]
  }
}
```

### Authentication Required (401)

```json
{
  "detail": "Authentication required. Please sign in to analyze flyers."
}
```

## Security Checklist

- [x] Rate limiting on all endpoints
- [x] Daily usage quotas per user
- [x] Content moderation for uploads
- [x] Authentication for expensive operations
- [x] File size and type validation
- [x] Usage logging and tracking
- [x] Supabase RLS policies
- [ ] Redis for distributed rate limiting (production)
- [ ] IP blocking for repeated abuse (production)
- [ ] CAPTCHA for sign-up (production)
- [ ] Monitoring and alerts (production)

---

**Built with security in mind** 🔒 | OpenPlaces API
