# OpenPlaces Backend

Strategic Ad Placement Recommender for Arlington, VA - FastAPI Backend

## Tech Stack

- **FastAPI** - Modern Python web framework with async support
- **Python 3.11+** - Latest Python features
- **Uvicorn** - ASGI server with auto-reload
- **Pydantic** - Data validation using Python type annotations
- **SQLAlchemy** - ORM for database operations
- **Supabase** - PostgreSQL database with PostGIS
- **OpenAI** - Vision API for flyer analysis
- **Pytest** - Testing framework

## Getting Started

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### Development

Start the development server with auto-reload:

```bash
python app/main.py
```

Or using uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- Interactive docs (Swagger): `http://localhost:8000/docs`
- Alternative docs (ReDoc): `http://localhost:8000/redoc`

### Testing

Run tests:

```bash
pytest
```

Run tests with coverage:

```bash
pytest --cov=app tests/ --cov-report=term-missing
```

### Code Quality

Format code with Black:

```bash
black app tests
```

Lint with Ruff:

```bash
ruff check app tests
```

Type check with mypy:

```bash
mypy app
```

## API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /api/health` - Health check (returns `{"status": "ok"}`)
- `GET /api/status` - Extended status with configuration state
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

### Future Endpoints (to be implemented)

- `POST /api/analyze` - Analyze flyer image with OpenAI Vision
- `POST /api/recommend` - Generate placement recommendations
- `GET /api/zones` - Get placement zones
- `POST /api/webhook/clerk` - Clerk user webhook for user sync

## Project Structure

```
backend/
├── app/
│   ├── __init__.py         # Package initialization
│   ├── main.py             # FastAPI application and routes
│   ├── config.py           # Configuration management
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas for validation
│   ├── services/           # Business logic and services
│   │   ├── openai.py       # OpenAI Vision API integration
│   │   ├── recommendation.py  # Recommendation engine
│   │   └── geocoding.py    # Venue geocoding service
│   ├── routers/            # API route handlers
│   ├── utils/              # Utility functions
│   └── data/               # Static data (zones GeoJSON, etc.)
├── tests/                  # Test files
│   ├── test_main.py        # Main app tests
│   ├── test_services/      # Service tests
│   └── conftest.py         # Pytest configuration
├── requirements.txt        # Python dependencies
├── .env.example            # Example environment variables
└── README.md               # This file
```

## Environment Variables

See `.env.example` for all required environment variables:

- `OPENAI_API_KEY` - OpenAI API key for Vision API
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `MAPBOX_API_KEY` - Mapbox API key for geocoding
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret for user sync
- `DATABASE_URL` - PostgreSQL database connection string

## Acceptance Criteria (Story 1.2)

✅ FastAPI environment with app/main.py
✅ API runs at localhost:8000 with auto-generated docs at /docs
✅ Auto-reload works in development mode

## Next Steps

- Story 1.3: Configure CORS and Frontend-Backend Communication
- Story 1.4: Setup Environment Variables Configuration
- Story 1.5: Initialize Supabase PostgreSQL Database
