# OpenPlaces Frontend

Strategic Ad Placement Recommender for Arlington, VA - React Frontend

## Tech Stack

- **React 18.2+** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite 5.x** - Fast build tool with HMR
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Build

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `VITE_MAPBOX_API_KEY` - Mapbox API key for map visualization
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication (optional)
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API clients and services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── test/           # Test utilities and setup
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Acceptance Criteria (Story 1.1)

✅ Frontend scaffolding created with React 18+, TypeScript, Vite 5.x
✅ Dev server runs at localhost:5173 with HMR
✅ Basic test setup with Vitest configured

## Next Steps

- Story 1.2: Initialize Backend with FastAPI + Python
- Story 1.3: Configure CORS and Frontend-Backend Communication
- Story 1.4: Setup Environment Variables Configuration
