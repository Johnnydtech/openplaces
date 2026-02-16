# OpenPlaces - Strategic Ad Placement Recommender

**AI-powered flyer placement recommendations for Arlington, VA events**

OpenPlaces uses computer vision, semantic matching, and real-time data to recommend the best locations to place event flyers based on audience demographics, timing, distance, and foot traffic patterns.

## 🎯 What It Does

1. **Upload an event flyer** (image or PDF)
2. **AI extracts event details** (OpenAI Vision API)
3. **Get top 10 placement recommendations** ranked by:
   - 🎯 **Audience Match** (40%) - Semantic matching with OpenAI embeddings
   - ⏰ **Timing** (30%) - When your target audience is there
   - 📍 **Distance** (20%) - Proximity to venue
   - 👀 **Dwell Time** (10%) - How long people stop and look

4. **Interactive map** showing recommendations with Mapbox
5. **Risk warnings** for low-ROI locations with alternative suggestions
6. **Save recommendations** for future reference

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
- **OpenAI API** for:
  - Vision: Event detail extraction from flyers
  - Embeddings: Semantic audience matching
- **Supabase PostgreSQL** for data storage
- **Geopy** for geocoding

### Data Sources
- **Static zones** (10 curated Arlington locations) - Current
- **Arlington Parking API** (real parking data) - In progress
- **Google Places API** (venue data, popular times) - In progress

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **OpenAI API key** ([Get one](https://platform.openai.com/api-keys))
- **Supabase account** ([Sign up](https://supabase.com))
- **Clerk account** ([Sign up](https://clerk.com))
- **Mapbox API key** ([Sign up](https://account.mapbox.com/))

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
# OPENAI_API_KEY=sk-...
# SUPABASE_URL=https://...
# SUPABASE_KEY=...
# CLERK_SECRET_KEY=...

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
# Get embeddings for event audience and zone signals
event_embedding = openai.embeddings.create(
    model="text-embedding-3-small",
    input="kids, teens, adults, art enthusiasts"
)

zone_embedding = cached_embeddings["families, cultural, community"]

# Calculate cosine similarity
similarity = cosine_similarity(event_embedding, zone_embedding)
score = similarity * 40  # Scale to 0-40 points
```

## 🗺️ Data Sources

### Current (Static)
- 10 manually curated zones in Arlington, VA
- Based on real locations (metro stations, Whole Foods, gyms, etc.)
- Synthetic but realistic audience/timing data

### Future (Real Data Integration)
- **Arlington Parking API**: Real parking locations → high-traffic areas
- **Google Places API**: Venue data, popular times, foot traffic patterns
- **Census Data**: Demographics, household composition
- **Transit APIs**: WMATA ridership, peak times

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

- [x] AI flyer analysis (OpenAI Vision)
- [x] Semantic audience matching (OpenAI embeddings)
- [x] Interactive map with Mapbox
- [x] Risk warnings with alternatives
- [x] Temporal intelligence (time period toggle)
- [x] Save recommendations
- [ ] Real data integration (Arlington Parking + Google Places)
- [ ] Mobile app (React Native)
- [ ] Multi-city support
- [ ] A/B testing for recommendations
- [ ] Historical performance tracking

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using Claude Code**
