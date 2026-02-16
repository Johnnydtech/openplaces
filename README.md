# OpenPlaces - Strategic Ad Placement Recommender

**AI-powered flyer placement recommendations for Arlington, VA events**

OpenPlaces uses Claude Opus 4.6 vision AI, semantic matching, and real-time data to recommend the best locations to place event flyers based on audience demographics, timing, distance, and foot traffic patterns.

🎥 **[Watch Demo Video](#)** | 📖 **[View Documentation](./docs/)** | 🚀 **[Live Demo](#)**

## 🎯 What It Does

1. **Upload an event flyer** (JPG, PNG)
2. **Claude Opus 4.6 extracts event details** - Advanced vision AI with content moderation
3. **Get top 10 placement recommendations** ranked by:
   - 🎯 **Audience Match** (40%) - Semantic matching with Claude Opus 4.6
   - ⏰ **Timing** (30%) - When your target audience is there
   - 📍 **Distance** (20%) - Proximity to venue
   - 👀 **Dwell Time** (10%) - How long people stop and look

4. **Interactive map** showing recommendations with Mapbox GL JS
5. **Risk warnings** for low-ROI locations with alternative suggestions
6. **Save recommendations** with notes for future reference
7. **Real-time analytics** with hourly traffic patterns and demographics

## 🏗️ Architecture

### Frontend
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Mapbox GL JS** for interactive maps
- **Clerk** for authentication
- **Axios** for API calls

### Backend
- **FastAPI** (Python 3.11+)
- **Claude Opus 4.6** for:
  - Vision: Event detail extraction from flyers
  - Semantic audience matching with context understanding
  - Content moderation for uploaded images
- **Supabase PostgreSQL** for:
  - Zone data with PostGIS support
  - Saved recommendations
  - User data
- **Geopy** for geocoding
- **Rate limiting** per-user abuse prevention

### Data Sources
- **Dynamic zones** (29 zones) - Database-persisted, auto-refreshing
- **Arlington Parking API** - Real parking locations and availability ✅
- **Google Places API** - Venue data, popular times, foot traffic ✅
- **Static fallback** - Curated zones for offline reliability

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Anthropic API key** for Claude Opus 4.6 ([Get one](https://console.anthropic.com/))
- **Supabase account** ([Sign up](https://supabase.com))
- **Clerk account** for authentication ([Sign up](https://clerk.com))
- **Mapbox API key** ([Sign up](https://account.mapbox.com/))
- **Google Places API key** (optional, for real venue data)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/openplaces.git
cd openplaces
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your API keys to .env:
# ANTHROPIC_API_KEY=sk-ant-...
# SUPABASE_URL=https://...
# SUPABASE_KEY=...
# CLERK_SECRET_KEY=...
# GOOGLE_PLACES_API_KEY=... (optional)

# Run database migrations (see SUPABASE_SETUP.md)

# Start backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd openplaces-frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local
# Add your API keys:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_MAPBOX_API_KEY=pk.eyJ1...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Start frontend
npm run dev
```

### 4. Open Application
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
openplaces/
├── backend/
│   ├── app/
│   │   ├── data/             # Zone data (GeoJSON)
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── recommendations.py  # Scoring algorithm + embeddings
│   │   │   ├── zones.py           # Zone data management
│   │   │   └── data_ingestion.py  # Real data integration
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env
│
├── openplaces-frontend/
│   ├── app/                 # Next.js pages
│   │   ├── upload/         # Flyer upload
│   │   ├── recommendations/ # Results display
│   │   └── saved-recommendations/
│   ├── components/         # React components
│   │   ├── Map.tsx        # Mapbox integration
│   │   ├── RecommendationCard.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── analytics.ts   # Event tracking
│   └── package.json
│
└── README.md
```

## 🎨 Key Features

### 1. AI Event Extraction
- Upload flyer image/PDF → OpenAI Vision extracts event details
- Edit extracted data before getting recommendations
- Automatic venue geocoding

### 2. Semantic Audience Matching
- **Problem**: Event targets "art enthusiasts", zones have "cultural interests"
- **Solution**: OpenAI embeddings for semantic similarity
- **Result**: Intelligent matching instead of exact string matching

### 3. Interactive Map
- Mapbox GL JS for smooth pan/zoom/rotate
- Zone markers color-coded by rank (green = top 3)
- Venue marker with distance circles (1km, 3km, 5km)
- Click zone → see details panel
- Hover card ↔ highlight map marker

### 4. Risk Warnings
- Detects "deceptive hotspots" (high traffic, low conversion)
- Visual warnings with alternative suggestions
- Categorized by issue: Low dwell time, poor audience match, timing misalignment, visual noise
- "Permission to Say No" framing (advisory, not prescriptive)

### 5. Temporal Intelligence
- Toggle time period: Morning / Lunch / Evening
- Dynamic re-ranking based on when people are actually there
- Timing-specific reasoning for each zone

### 6. Save & Track
- Save recommendations for future reference
- Add notes to saved zones
- View history of all saved recommendations
- Delete recommendations when no longer needed

## 🔬 Technical Highlights

### Scoring Algorithm
```python
total_score = (
    audience_match_score +      # 0-40 points (OpenAI embeddings)
    temporal_alignment_score +   # 0-30 points
    distance_score +             # 0-20 points
    dwell_time_score             # 0-10 points
)  # Final: 0-100%
```

### Semantic Audience Matching
```python
# Claude Opus 4.6 semantic understanding
prompt = f"""Score how well this zone's audience matches the event's target audience.
Event Target Audience: {target_audience}
Zone Audience Profile: {zone_demographics}, {zone_interests}, {zone_behaviors}

Consider semantic overlap, lifestyle compatibility, demographic alignment.
Respond with JSON: {{"score": <0-40>, "reasoning": "..."}}"""

response = await claude_client.messages.create(
    model="claude-opus-4-6",
    messages=[{"role": "user", "content": prompt}],
    timeout=30.0  # With fallback to keyword matching
)
```

## 🗺️ Data Sources & Persistence

### Dynamic Zone Generation ✅
- **29 zones** generated from Arlington Parking API + Google Places
- **Database persistence** (Supabase PostgreSQL with PostGIS)
- **3-tier caching**: Memory (24hr) → Database → API generation → Static fallback
- **Auto-refresh**: Updates every 24 hours or on-demand via `/zones/refresh`

### Real Data Integration ✅
- **Arlington Parking API**: 400+ parking locations → high-traffic placement zones
- **Google Places API**: Venue names, foot traffic estimates, popular times
- **Geocoding**: Geopy + Nominatim for accurate coordinates
- **Static fallback**: 29 curated zones for offline reliability

### Future Integrations
- **Census Data**: Demographics, household composition
- **Transit APIs**: WMATA ridership, peak times
- **Historical performance**: Track actual placement results

## 📊 API Endpoints

### Core Endpoints
- `POST /api/analyze` - Extract event details from flyer image
- `POST /api/geocode` - Convert address to coordinates
- `POST /api/recommendations/top` - Get ranked zone recommendations
- `GET /api/saved-recommendations/{user_id}` - View saved recommendations

### Data Ingestion (In Progress)
- `POST /api/data/generate-zones` - Generate zones from real data
- `GET /api/data/parking-locations` - Fetch Arlington parking data
- `GET /api/data/test-google-places` - Test Google Places integration

See full API documentation at `http://localhost:8000/docs`

## 🧪 Development

### Running Tests
```bash
cd backend
pytest
```

### Database Migrations
```bash
cd backend/migrations
# Follow instructions in APPLY_MIGRATIONS.md
```

### Analytics Tracking
Event tracking is implemented with console.log (development).
For production, integrate PostHog or Mixpanel in `lib/analytics.ts`.

## 🎯 Roadmap

### ✅ Completed
- [x] AI flyer analysis (Claude Opus 4.6 Vision)
- [x] Content moderation for uploaded images
- [x] Semantic audience matching (Claude Opus 4.6)
- [x] Interactive map with Mapbox GL JS
- [x] Risk warnings with alternatives
- [x] Temporal intelligence (time period toggle)
- [x] Save recommendations with notes
- [x] Real data integration (Arlington Parking + Google Places)
- [x] Database persistence with auto-refresh
- [x] Per-user rate limiting (abuse prevention)
- [x] Real-time analytics with hourly traffic

### 🚧 In Progress
- [ ] Frontend optimization (reduce Claude timeout issues)
- [ ] Batch progress streaming for long operations

### 📋 Future
- [ ] Mobile app (React Native)
- [ ] Multi-city support (DC, Baltimore, Alexandria)
- [ ] A/B testing for recommendations
- [ ] Historical performance tracking (QR codes on flyers)
- [ ] Community feedback integration

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using Claude Code**
