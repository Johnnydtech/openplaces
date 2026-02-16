# OpenPlaces Documentation

Technical documentation for OpenPlaces - Strategic Ad Placement Recommender.

## 📚 Documentation Index

### Architecture & Features
- **[Database Persistence](./DATABASE_PERSISTENCE.md)** - How zones are persisted in Supabase with 3-tier caching
- **[Dynamic Zones](./DYNAMIC_ZONES.md)** - Real-time zone generation from Arlington Parking + Google Places APIs
- **[Static Zones Migration](./STATIC_ZONES_MIGRATION.md)** - How to migrate from static GeoJSON to database

### Operations
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist for production deployment
- **[Abuse Prevention](./ABUSE_PREVENTION.md)** - Rate limiting, usage tracking, and content moderation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 16)                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Upload Page │  │ Recommendations│  │  Saved History   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────────┐
│                     Backend (FastAPI)                        │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Vision       │  │ Recommendations│ │ Content Moderation│  │
│  │ Analysis     │  │ Engine       │  │                  │   │
│  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                  │                   │             │
│         ▼                  ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Claude Opus 4.6 (Anthropic API)            │    │
│  │  • Vision: Flyer extraction                          │    │
│  │  • Semantic: Audience matching                       │    │
│  │  • Moderation: Content safety                        │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Supabase PostgreSQL + PostGIS                   │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │  Zones   │  │ Saved          │  │ Usage Tracking   │    │
│  │  (29)    │  │ Recommendations│  │ (Rate Limiting)  │    │
│  └──────────┘  └────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  External Data Sources                       │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │ Arlington Parking│         │  Google Places API   │      │
│  │ (400+ locations) │         │  (Venue data, times) │      │
│  └──────────────────┘         └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Flyer Upload → Event Extraction
```
User uploads flyer → Content moderation (Claude) → Vision extraction (Claude)
→ Geocoding (Geopy) → Event details ready
```

### 2. Zone Loading (3-Tier Cache)
```
Memory cache (24hr) → Database (instant) → API generation (slow) → Static fallback
```

### 3. Recommendation Generation
```
Event details + Zones → Batch Claude scoring (5 zones/batch, 0.5s delay)
→ Temporal + Distance + Dwell time → Risk detection → Ranked results
```

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```bash
# Claude API (required)
ANTHROPIC_API_KEY=sk-ant-...

# Database (required)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...

# Authentication (required)
CLERK_SECRET_KEY=sk_test_...

# External APIs (optional)
GOOGLE_PLACES_API_KEY=AIza...
```

**Frontend** (`openplaces-frontend/.env.local`):
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Mapbox (required)
NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1...

# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 📊 Database Schema

### Zones Table
```sql
CREATE TABLE zones (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326),  -- PostGIS (legacy)
    latitude DECIMAL(10, 8),          -- Simple queries
    longitude DECIMAL(11, 8),         -- Simple queries
    audience_signals JSONB NOT NULL,
    timing_windows JSONB NOT NULL,
    dwell_time_seconds INTEGER NOT NULL,
    cost_tier VARCHAR(50) NOT NULL,
    foot_traffic_daily INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Saved Recommendations Table
```sql
CREATE TABLE saved_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    zone_id VARCHAR(255) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);
```

### Usage Tracking Table
```sql
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    cost_usd DECIMAL(10, 4)
);
```

## 🚀 API Endpoints

### Core Endpoints
- `POST /api/analyze` - Extract event details from flyer (Claude Vision)
- `POST /api/geocode` - Geocode venue address
- `POST /api/recommendations/top` - Get ranked recommendations
- `GET /api/saved-recommendations/{user_id}` - View saved recommendations
- `POST /api/saved-recommendations/save` - Save a recommendation
- `DELETE /api/saved-recommendations/{id}` - Delete saved recommendation

### Zone Management
- `GET /api/zones` - List all zones
- `POST /api/zones/refresh` - Force refresh from APIs
- `POST /api/zones/import-static` - Import from zones.geojson
- `DELETE /api/zones/clear` - Clear all zones (admin)

### Data Ingestion (Admin)
- `POST /api/data/generate-zones` - Generate zones from APIs
- `GET /api/data/parking-locations` - Test Arlington Parking API
- `GET /api/data/test-google-places` - Test Google Places API

Full API docs: http://localhost:8000/docs

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests (coming soon)
cd openplaces-frontend
npm test
```

## 📈 Performance Metrics

- **Flyer extraction**: ~8-12s (Claude Opus 4.6 Vision)
- **Zone loading**: <100ms (from database)
- **Recommendation generation**: 45-90s (29 zones, Claude scoring with rate limits)
- **Geocoding**: ~1-2s (Nominatim)

## 🔒 Security & Abuse Prevention

- **Content moderation**: All uploaded images scanned by Claude
- **Rate limiting**: 5 requests/minute per user per endpoint
- **Daily limits**: 100 analyses per user per day
- **Authentication**: Clerk user sessions required
- **Usage tracking**: All API calls logged with cost estimation

See [ABUSE_PREVENTION.md](./ABUSE_PREVENTION.md) for details.

## 🐛 Troubleshooting

### "Failed to generate recommendations"
- **Cause**: Claude API timeout (scoring 29 zones takes 45-90s)
- **Solution**: Frontend timeout increased to 120s, backend has 30s timeout per zone with fallback

### "No zones found in database"
- **Cause**: Database empty or migration not run
- **Solution**: `POST /api/zones/import-static` or `POST /api/zones/refresh`

### "Claude API 500 error"
- **Cause**: Invalid model name or API key
- **Solution**: Ensure `ANTHROPIC_API_KEY` is set and model is `claude-opus-4-6`

### Arlington Parking API not responding
- **Cause**: Network issues or DNS resolution failure
- **Solution**: System falls back to static zones automatically

## 📞 Support

- **Issues**: Open a GitHub issue
- **Documentation**: See this directory for technical docs
- **Demo**: [Watch video](#)

---

**Built with ❤️ using Claude Code**
