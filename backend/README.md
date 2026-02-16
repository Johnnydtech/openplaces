# OpenPlaces Backend 🎯

**Smart Placement Intelligence for Any Message** - AI-powered location recommendations for physical ads, posters, and public notices in Arlington, VA.

## 🌟 What is OpenPlaces?

OpenPlaces uses AI and real-time data to recommend the best physical locations to place your message—whether it's an event poster, lost pet flyer, or emergency notice. Upload any image, and get ranked location recommendations based on:

- 👥 **Audience matching** - Demographics aligned with your target audience
- 📊 **Foot traffic patterns** - Real-time pedestrian data
- 📍 **Location intelligence** - Distance scoring from your venue
- ⚠️ **Risk detection** - Automated warnings for low-performing zones

**Current Coverage:** Arlington, VA (Beta)

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- API keys (see [Getting API Keys](#-getting-api-keys) section)

### Installation

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys (see below for how to get them).

5. **Set up Google Cloud credentials** (for OCR):
- Download service account JSON from [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
- Save as `google-cloud-key.json` in the `backend/` directory
- ⚠️ **Important:** This file is gitignored and should NEVER be committed

6. **Start the server:**
```bash
python app/main.py
```

The API will be available at:
- 🌐 **API:** http://localhost:8000
- 📚 **Swagger Docs:** http://localhost:8000/docs
- 📖 **ReDoc:** http://localhost:8000/redoc

## 🔑 Getting API Keys

### Required API Keys

| Service | Purpose | Get It Here | Cost |
|---------|---------|-------------|------|
| **OpenAI** | AI flyer analysis & embeddings | [platform.openai.com](https://platform.openai.com/api-keys) | Pay-as-you-go ($) |
| **Supabase** | PostgreSQL database with PostGIS | [supabase.com](https://supabase.com) | Free tier available |
| **Mapbox** | Geocoding & mapping | [mapbox.com](https://account.mapbox.com/) | Free tier available |
| **Clerk** | User authentication | [clerk.com](https://clerk.com) | Free tier available |
| **Google Cloud** | Vision API for OCR | [console.cloud.google.com](https://console.cloud.google.com) | Free tier available |
| **Google Places** | Location data | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Free tier available |

### Setting Up Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Cloud Vision API**
4. Create a **Service Account**:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Grant "Viewer" role
   - Create and download JSON key
5. Save the JSON key as `google-cloud-key.json` in `backend/` directory
6. Set path in `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/backend/google-cloud-key.json
   ```

### Setting Up Clerk Webhooks

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → **Add Endpoint**
3. Configure endpoint:
   - URL: `https://your-ngrok-url.ngrok-free.dev/api/webhooks/clerk`
   - Events: Select `user.created` and `user.updated`
4. Copy the **Signing Secret** and add to `.env`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_xxxxx
   ```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app & route configuration
│   ├── supabase_client.py         # Supabase connection
│   ├── routes/
│   │   ├── analyze.py             # POST /api/analyze - Flyer analysis
│   │   ├── recommendations.py     # POST /api/recommendations/top - Get recommendations
│   │   ├── saved_recommendations.py # Saved places CRUD
│   │   ├── webhooks.py            # Clerk webhook handler
│   │   ├── geocoding.py           # Venue geocoding
│   │   └── data_ingestion.py     # Arlington & Google data sync
│   ├── services/
│   │   ├── openai_service.py      # OpenAI Vision & embeddings
│   │   ├── recommendation_engine.py # Scoring algorithm
│   │   └── audience_matching.py   # Semantic matching
│   └── data/
│       └── zones.geojson          # Arlington placement zones
├── tests/                         # Test suite
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment template
├── google-cloud-key.json          # ⚠️ Your credentials (gitignored)
└── README.md                      # You are here
```

## 🔌 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info & version |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/status` | Configuration status |
| `GET` | `/docs` | Swagger UI documentation |

### Analysis & Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze flyer image with AI (OCR + extraction) |
| `POST` | `/api/geocode` | Convert venue address to coordinates |
| `POST` | `/api/recommendations/top` | Get ranked placement recommendations |

**Example Request:**
```bash
# Analyze a flyer
curl -X POST http://localhost:8000/api/analyze \
  -F "file=@event-flyer.jpg"

# Get recommendations
curl -X POST http://localhost:8000/api/recommendations/top \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Music Festival",
    "date": "2026-07-15",
    "venue_lat": 38.8816,
    "venue_lon": -77.0910,
    "target_audience": ["young-adults", "music-lovers"],
    "event_type": "music",
    "time_period": "evening"
  }'
```

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/clerk` | Clerk webhook (syncs users to DB) |
| `GET` | `/api/saved-recommendations/{user_id}` | Get user's saved places |
| `POST` | `/api/saved-recommendations/save` | Save a recommendation |
| `DELETE` | `/api/saved-recommendations/{id}` | Delete saved recommendation |

### Data Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/data/sync-arlington-parking` | Sync Arlington parking data |
| `POST` | `/api/data/sync-google-places` | Sync Google Places data |
| `GET` | `/api/data/status` | Check data freshness |

## 🏗️ Architecture

### Tech Stack

- **FastAPI** - Modern Python async web framework
- **OpenAI GPT-4o** - Vision API for flyer analysis + text-embedding-3-small
- **Supabase PostgreSQL** - Database with PostGIS for geospatial queries
- **Google Cloud Vision** - OCR for text extraction
- **Clerk** - User authentication & webhooks
- **Mapbox** - Geocoding services

### Recommendation Algorithm

1. **Flyer Analysis** - Extract event details, audience, type
2. **Audience Matching** - Semantic similarity using OpenAI embeddings (40 points)
3. **Temporal Scoring** - Match event time with zone traffic patterns (30 points)
4. **Distance Scoring** - Proximity to venue location (20 points)
5. **Dwell Time** - Pedestrian lingering duration (10 points)
6. **Risk Detection** - Flag zones with poor metrics (<50% threshold)

**Total Score:** 0-100 scale (weighted sum of all factors)

## 🧪 Testing

Run the test suite:

```bash
# All tests
pytest

# With coverage report
pytest --cov=app tests/ --cov-report=html

# Specific test file
pytest tests/test_recommendations.py -v
```

## 🛠️ Development

### Code Quality

```bash
# Format code
black app tests

# Lint
ruff check app tests

# Type check
mypy app
```

### Database Setup

The app uses Supabase PostgreSQL. Schema is managed via Supabase migrations:

```sql
-- Key tables:
- users (id, clerk_user_id, email)
- saved_recommendations (user saves)
- zones (Arlington placement zones with GeoJSON)
- zone_analytics (traffic data from Arlington + Google)
```

See `DATABASE_SETUP.md` for detailed schema.

## 🚨 Common Issues

### "google-cloud-key.json not found"
- Ensure file exists in `backend/` directory
- Check `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`
- File should NOT be committed to git (it's in `.gitignore`)

### "CLERK_WEBHOOK_SECRET not set"
- Add webhook secret from Clerk dashboard to `.env`
- Format: `CLERK_WEBHOOK_SECRET=whsec_xxxxx`

### "ModuleNotFoundError: No module named 'app'"
- Activate virtual environment: `source venv/bin/activate`
- Ensure dependencies installed: `pip install -r requirements.txt`

### Database connection errors
- Check Supabase URL and service key in `.env`
- Verify Supabase project is active
- Ensure PostGIS extension is enabled

## 📊 Data Sources

### Arlington County Open Data
- **Parking Locations** - MapServer API (street parking zones)
- **Demographics** - Census tract data
- **Foot Traffic** - Anonymized pedestrian counts

### Google Places API
- **Business listings** - POI data for Arlington
- **Reviews & ratings** - Location popularity
- **Opening hours** - Temporal patterns

## 🎯 Hackathon Highlights

- ✨ **AI-Powered Analysis** - Computer vision extracts event details automatically
- 🧠 **Semantic Matching** - Embeddings match audience demographics intelligently
- 📍 **Real Data** - Arlington County open data + Google Places
- ⚠️ **Smart Warnings** - Automatic risk detection with better alternatives
- 🚀 **Production-Ready** - Full test coverage, type hints, error handling

## 📝 Environment Variables Reference

```bash
# OpenAI (required)
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4o-mini

# Google Cloud Vision (required for OCR)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-cloud-key.json

# Supabase (required)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxx...

# Mapbox (required)
MAPBOX_API_KEY=sk.eyJ1xxxxx...

# Clerk (required for auth)
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Google Places (required)
GOOGLE_PLACES_API=AIzaSyxxxxx...

# Server config (optional)
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
ENVIRONMENT=development
```

## 🤝 Contributing

This is an open-source hackathon project. Contributions welcome!

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Questions?

- Check `/docs` endpoint for interactive API documentation
- Review test files in `tests/` for usage examples
- Open an issue on GitHub

---

**Built with ❤️ for Arlington, VA** | Beta Program | [OpenPlaces](https://openplaces.dev)
