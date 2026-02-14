# OpenPlaces - Strategic Ad Placement Recommender

> AI-powered strategic ad placement recommendations for small businesses in Arlington, VA

## Overview

OpenPlaces helps small business owners make data-driven decisions about where to place physical advertisements for their events. By analyzing event flyers with AI and combining it with community data, OpenPlaces provides transparent, ranked recommendations with the "Permission to Say No" - protecting users from costly placement mistakes.

## Core Features

### 🎯 Smart Recommendations
- Upload event flyers for instant AI analysis
- Get ranked top 10 placement zones based on:
  - Audience match (40%)
  - Timing alignment (30%)
  - Distance from venue (20%)
  - Dwell time (10%)

### 🗺️ Interactive Mapping
- Visualize recommendations on interactive Arlington map
- Click zones for detailed breakdowns
- Distance circles for geographic context

### ⏰ Temporal Intelligence
- Toggle between Morning/Lunch/Evening time periods
- Dynamic re-ranking based on time-of-day audience behavior
- Strategic reasoning (e.g., "commuters planning weekends")

### ⚠️ Risk Protection
- Deceptive hotspot detection
- Clear warnings for ineffective zones
- Better alternative suggestions

### 🔍 Transparency
- Every recommendation shows WHY with data sources
- Scoring breakdown (never black-box)
- Signals found vs. not detected
- Data freshness timestamps

## Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern, type-safe UI
- **Vite 5** - Lightning-fast development and builds
- **Mapbox GL JS** - Interactive map visualization
- **Vitest** - Unit testing with coverage

### Backend
- **FastAPI** (Python 3.11+) - High-performance async API
- **OpenAI Vision API** - Flyer analysis and event extraction
- **Supabase PostgreSQL + PostGIS** - Geospatial database
- **Pytest** - Comprehensive API testing

### Infrastructure
- **Clerk** - Authentication (optional for freemium model)
- **Supabase Storage** - Flyer upload persistence
- **Arlington Open Data** - Community signals and data

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Claude-Code-Hack
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your API keys
   ```

### Development

**Start Backend** (Terminal 1):
```bash
cd backend
source venv/bin/activate
python app/main.py
```
Backend runs at `http://localhost:8000` with docs at `/docs`

**Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173`

### Testing

**Frontend Tests**:
```bash
cd frontend
npm test                # Watch mode
npm run test:coverage   # With coverage report
```

**Backend Tests**:
```bash
cd backend
pytest                  # Run all tests
pytest --cov=app tests/ --cov-report=term-missing  # With coverage
```

## Project Structure

```
/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API clients
│   │   ├── types/        # TypeScript types
│   │   └── test/         # Test utilities
│   └── package.json
│
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # Application entry
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── routers/     # API routes
│   ├── tests/           # Backend tests
│   └── requirements.txt
│
├── .ralph/              # Ralph AI agent configuration
│   ├── specs/           # Project specifications
│   ├── @fix_plan.md    # Prioritized task list
│   └── logs/            # Development logs
│
└── docs/                # Project documentation
```

## API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/status` - Configuration status
- `GET /docs` - Interactive API documentation

### Planned Endpoints
- `POST /api/analyze` - Analyze event flyer
- `POST /api/recommend` - Generate recommendations
- `GET /api/zones` - Get placement zones
- `POST /api/webhook/clerk` - User sync webhook

## Development Workflow

### Epic Progress (66 stories across 7 epics)

- ✅ **Epic 1: Project Foundation** (Stories 1.1-1.4 complete)
- ⏳ **Epic 1: Remaining** (Stories 1.5-1.7 in progress)
- ⏳ Epic 2: Authentication & User Management
- ⏳ Epic 3: Upload & Event Discovery
- ⏳ Epic 4: Strategic Placement Recommendations
- ⏳ Epic 5: Interactive Map Visualization
- ⏳ Epic 6: Temporal Intelligence
- ⏳ Epic 7: Risk Assessment & Warnings

### Current Status
- **Phase**: Foundation Setup Complete
- **Next**: Database initialization and schema creation
- **See**: `.ralph/@fix_plan.md` for detailed task list

## Environment Variables

### Frontend (.env.local)
```bash
VITE_MAPBOX_API_KEY=your_mapbox_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
MAPBOX_API_KEY=your_mapbox_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

## Performance Requirements

- **Time to Strategic Clarity**: ≤60 seconds from upload to recommendations
  - OpenAI Vision API: <45 seconds
  - Recommendation Engine: <10 seconds
  - Map Rendering: <3 seconds
- **Map Interactions**: <200ms response time
- **Test Coverage**: 85% minimum for all new code

## Architecture Highlights

### Key Design Decisions
1. **Transparency First**: Every recommendation includes reasoning and data sources
2. **Privacy-Focused**: No permanent storage of uploaded flyers (7-day expiration)
3. **Offline-Capable**: Cached data and map tiles for demo reliability
4. **Freemium Model**: Anonymous users see top 3 zones, authenticated users see all 10
5. **Ethical AI**: "Permission to Say No" - warnings protect from bad placements

## Contributing

This project follows TDD methodology with red-green-refactor cycles:
1. Write failing test first (from acceptance criteria)
2. Implement minimum code to pass
3. Refactor for quality
4. Commit with conventional commit message

### Commit Convention
```bash
feat(epic-N): complete Story N.M - [title]
fix(component): description
test(service): add tests for feature
docs(readme): update documentation
```

## License

[To be determined]

## Team

Built with ❤️ by Yohanesw

## Support

For issues and feature requests, see `.ralph/specs/` for project specifications or check the interactive API docs at `http://localhost:8000/docs` when running locally.

---

**Note**: This project is built using the BMAD methodology with Ralph autonomous AI agent. See `CLAUDE.md` and `.ralph/PROMPT.md` for agent instructions and development workflow.
