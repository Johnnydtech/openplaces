# OpenPlaces Frontend 🎨

**Smart Placement Intelligence for Any Message** - Modern, responsive web interface built with Next.js 16 and React 19.

## 🌟 What is This?

The OpenPlaces frontend provides an intuitive interface for users to:
- 📤 Upload posters/flyers via drag-and-drop or camera
- 🗺️ View AI-powered location recommendations on an interactive map
- 💾 Save favorite placement zones
- 📊 Analyze foot traffic, demographics, and timing data
- ⚠️ Review risk warnings with alternative suggestions

**Live Demo:** [openplaces.dev](https://openplaces.dev) (Arlington, VA Beta)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Backend API running (see `../backend/README.md`)
- API keys for Clerk, Mapbox, Google Maps

### Installation

1. **Navigate to frontend:**
```bash
cd openplaces-frontend
```

2. **Install dependencies:**
```bash
npm install
# or
bun install
```

3. **Configure environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Mapbox (for maps)
NEXT_PUBLIC_MAPBOX_API_KEY=sk.eyJ1xxxxx

# Google Maps (for Street View thumbnails)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Start development server:**
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Getting API Keys

### Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key** from the dashboard
4. Configure sign-in methods (Email, Google, etc.)
5. Add `http://localhost:3000` to allowed origins in Clerk settings

### Mapbox

1. Sign up at [mapbox.com](https://account.mapbox.com/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new token or use the default public token
4. Copy the token (starts with `pk.` for public or `sk.` for secret)

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key or use existing
3. Enable **Maps JavaScript API** for your project
4. (Optional) Restrict the key to your domain for security

## 📁 Project Structure

```
openplaces-frontend/
├── app/
│   ├── page.tsx                    # Main homepage with upload & recommendations
│   ├── layout.tsx                  # Root layout with fonts & providers
│   ├── sign-in/[[...sign-in]]/     # Clerk sign-in page
│   ├── sign-up/[[...sign-up]]/     # Clerk sign-up page
│   ├── saved-recommendations/      # Saved places page
│   └── globals.css                 # Global styles & CSS variables
├── components/
│   ├── Map.tsx                     # Interactive Mapbox map with markers
│   ├── RecommendationCard.tsx      # Zone recommendation card
│   ├── SaveButton.tsx              # Save/unsave toggle button
│   ├── UploadZone.tsx              # Drag-and-drop file upload
│   ├── EventConfirmation.tsx       # Edit extracted event details
│   ├── ZoneDetailsPanel.tsx        # Right sidebar with zone analytics
│   ├── SavedRecommendationCard.tsx # Saved places card with notes
│   └── analytics/                  # Analytics charts (traffic, demographics)
├── lib/
│   ├── api.ts                      # Backend API client with axios
│   ├── analytics.ts                # Event tracking (PostHog ready)
│   └── timeUtils.ts                # Time period utilities
├── public/
│   └── logo.png                    # OpenPlaces logo
├── .env.local.example              # Environment variables template
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
└── package.json                    # Dependencies
```

## 🎨 Tech Stack

- **Next.js 16.1.6** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.x** - Utility-first styling
- **Clerk** - Authentication & user management
- **Mapbox GL JS** - Interactive maps
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **React Dropzone** - File upload with drag-and-drop

## 🗺️ Key Features

### 1. Flyer Upload & Analysis
- Drag-and-drop or click to upload (JPG, PNG, PDF)
- Mobile camera integration
- AI extraction with editable confirmation

### 2. Interactive Map
- Dark Mapbox theme for Arlington, VA
- Ranked zone markers (color-coded by score)
- Venue location marker (blue crosshair)
- Distance circles (1km, 3km, 5km)
- Hover highlighting & click details

### 3. Recommendation Cards
- Match score, distance, timing windows
- Risk warnings with alternatives
- Hover effects & smooth animations
- Save button with instant feedback

### 4. Zone Details Panel
- Full analytics (traffic, demographics, timing)
- Interactive charts (Recharts library)
- Busiest days, hourly traffic, gender distribution
- Google Street View thumbnail

### 5. Saved Recommendations
- Personal library of saved places
- Add/edit notes (500 char limit)
- Delete saved items
- Search history by event

## 🎨 Design System

### Colors

| Variable | Color | Usage |
|----------|-------|-------|
| `--background` | `#0f1c24` | Page background |
| `--foreground` | `#e5e7eb` | Primary text |
| `--sidebar-bg` | `#1a2f3a` | Sidebar background |
| `--panel-bg` | `#1e3a48` | Card backgrounds |
| `--accent-green` | `#4ade80` | Primary accent |
| `--text-muted` | `#94a3b8` | Secondary text |

### Typography

- **Body Font:** Inter (clean, modern sans-serif)
- **Display Font:** Plus Jakarta Sans (headings)
- **Monospace:** System mono (code, IDs)

### Component Patterns

- **Cards:** Rounded corners, subtle shadows, hover effects
- **Buttons:** Clear states (default, hover, active, disabled)
- **Inputs:** Focus rings with accent color
- **Loading:** Skeleton screens & spinners

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Using Bun (faster)
bun dev              # Start dev server
bun run build        # Build for production
```

## 🚨 Common Issues

### "Clerk publishable key not found"
- Check `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Restart dev server after adding env vars
- Verify the key is correct from Clerk dashboard

### Map not loading
- Verify `NEXT_PUBLIC_MAPBOX_API_KEY` is set
- Check browser console for API errors
- Ensure Mapbox token has necessary scopes

### Backend API connection failed
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured in backend

### "Module not found" errors
- Delete `.next` folder: `rm -rf .next`
- Clear cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

## 📊 API Integration

The frontend communicates with the backend API for:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` | Upload & analyze flyer |
| `POST /api/geocode` | Convert address to coordinates |
| `POST /api/recommendations/top` | Get ranked recommendations |
| `GET /api/saved-recommendations/{user_id}` | Fetch saved places |
| `POST /api/saved-recommendations/save` | Save a recommendation |

See `lib/api.ts` for complete API client implementation.

## 🎯 Hackathon Highlights

- 🎨 **Modern UI/UX** - Clean, intuitive interface with smooth animations
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ♿ **Accessibility** - Keyboard navigation, ARIA labels, focus indicators
- 🚀 **Performance** - Next.js optimization, image lazy loading, code splitting
- 🔐 **Secure** - Clerk authentication, API key protection, CORS
- 📊 **Data Visualization** - Interactive charts for traffic patterns
- 🗺️ **Interactive Maps** - Real-time highlighting, smooth zoom/pan

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_MAPBOX_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_API_URL` (your production backend URL)

## 🤝 Contributing

This is an open-source hackathon project. Contributions welcome!

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Questions?

- Check the backend README for API documentation
- Review component files for implementation examples
- Open an issue on GitHub

---

**Built with ❤️ for Arlington, VA** | Beta Program | [OpenPlaces](https://openplaces.dev)
