# OpenPlaces Backend

**AI-powered flyer placement recommendations for Arlington, VA events**

FastAPI backend using Claude Opus 4.6 for vision analysis, semantic audience matching, and content moderation.

## Quick Start

### Prerequisites

- Python 3.11+
- pip
- API keys (see below)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
uvicorn app.main:app --reload --port 8000
```

API available at:
- http://localhost:8000
- http://localhost:8000/docs (Swagger)

## Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| **Anthropic** | Claude Opus 4.6 (vision, semantic, moderation) | [console.anthropic.com](https://console.anthropic.com/) |
| **Supabase** | PostgreSQL database with PostGIS | [supabase.com](https://supabase.com) |
| **Clerk** | User authentication | [clerk.com](https://clerk.com) |
| **Google Places** | Venue data (optional) | [console.cloud.google.com](https://console.cloud.google.com) |

## Environment Variables

```bash
# Claude API (required)
ANTHROPIC_API_KEY=sk-ant-...

# Database (required)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...

# Authentication (required)
CLERK_SECRET_KEY=sk_test_...

# External data (optional)
GOOGLE_PLACES_API_KEY=AIza...
```

## Project Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI app
│   ├── supabase_client.py          # Database client
│   ├── routes/
│   │   ├── analyze.py              # POST /api/analyze
│   │   ├── recommendations.py      # POST /api/recommendations/top
│   │   ├── zones.py                # Zone management
│   │   ├── saved_recommendations.py # Save/view history
│   │   └── geocoding.py            # Venue geocoding
│   ├── services/
│   │   ├── vision.py               # Claude Vision (flyer extraction)
│   │   ├── recommendations.py      # Scoring engine
│   │   ├── content_moderator.py    # Claude moderation
│   │   ├── zones.py                # Zone management
│   │   └── data_ingestion.py       # Arlington + Google data
│   ├── middleware/
│   │   └── rate_limiter.py         # Abuse prevention
│   └── data/
│       └── zones.geojson           # Static fallback zones
├── migrations/                     # Database migrations
├── requirements.txt
└── .env.example
```

## API Endpoints

### Core
- `POST /api/analyze` - Extract event details from flyer (Claude Vision)
- `POST /api/geocode` - Geocode venue address
- `POST /api/recommendations/top` - Get ranked recommendations

### Zones
- `GET /api/zones` - List all zones
- `POST /api/zones/refresh` - Refresh from APIs
- `POST /api/zones/import-static` - Import from GeoJSON
- `DELETE /api/zones/clear` - Clear database

### Saved Recommendations
- `GET /api/saved-recommendations/{user_id}` - View saved
- `POST /api/saved-recommendations/save` - Save zone
- `DELETE /api/saved-recommendations/{id}` - Delete saved

Full docs: http://localhost:8000/docs

## Tech Stack

- **FastAPI** - Python async web framework
- **Claude Opus 4.6** - Vision, semantic matching, moderation
- **Supabase PostgreSQL** - Database with PostGIS
- **Geopy** - Geocoding

## Recommendation Algorithm

```python
total_score = (
    audience_match +     # 0-40 points (Claude semantic)
    temporal_score +     # 0-30 points
    distance_score +     # 0-20 points
    dwell_time_score     # 0-10 points
)  # Final: 0-100%
```

### Features

1. **Claude Vision Analysis** - Extract event details from flyers
2. **Semantic Matching** - Claude understands audience compatibility
3. **Dynamic Zones** - 29 zones from Arlington Parking + Google Places
4. **Database Persistence** - 3-tier caching (memory → DB → APIs → static)
5. **Risk Detection** - Warns about low-ROI zones with alternatives
6. **Content Moderation** - Claude scans uploaded images
7. **Rate Limiting** - Per-user abuse prevention

## Database Schema

### Zones Table
```sql
CREATE TABLE zones (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    location GEOGRAPHY(POINT, 4326),  -- PostGIS
    latitude DECIMAL(10, 8),          -- Simple queries
    longitude DECIMAL(11, 8),
    audience_signals JSONB,
    timing_windows JSONB,
    dwell_time_seconds INTEGER,
    cost_tier VARCHAR(50),
    foot_traffic_daily INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Saved Recommendations Table
```sql
CREATE TABLE saved_recommendations (
    id UUID PRIMARY KEY,
    user_id VARCHAR(255),
    zone_id VARCHAR(255),
    zone_name VARCHAR(255),
    event_name VARCHAR(255),
    event_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ
);
```

## Testing

```bash
pytest
pytest --cov=app tests/
```

## Deployment

### Railway (Recommended)
1. Push to GitHub
2. Connect to Railway
3. Add environment variables
4. Railway auto-deploys

Files included:
- `railway.json` - Railway config
- `Procfile` - Process definition
- `runtime.txt` - Python version

### Render/Fly.io
Works with Procfile and requirements.txt

## Performance

- Flyer extraction: 8-12s (Claude Vision)
- Zone loading: <100ms (from database)
- Recommendations: 45-90s (29 zones with Claude scoring)
- Geocoding: 1-2s

## API Costs

- Claude Opus 4.6: $15/1M input, $75/1M output tokens
- Vision analysis: ~$0.02-0.05 per flyer
- Audience matching: ~$0.001-0.002 per zone
- **Total per recommendation**: ~$0.05-0.10

## Common Issues

### "Failed to generate recommendations"
- Claude API timeout (29 zones take 45-90s)
- Check `ANTHROPIC_API_KEY` is set correctly
- Ensure model name is `claude-opus-4-6`

### "No zones in database"
- Run: `POST /api/zones/import-static`
- Or: `POST /api/zones/refresh` to generate from APIs

### Database connection errors
- Verify `SUPABASE_URL` and `SUPABASE_KEY`
- Check PostGIS extension enabled
- Run migrations in `migrations/` folder

## Data Sources

- **Arlington Parking API** - 400+ parking locations
- **Google Places API** - Venue data, foot traffic
- **Static zones** - Curated fallback (29 zones)

## License

MIT License

---

**Built with Claude Opus 4.6**
