# Baseline  ·  ATP tennis analytics web app

A full-stack analytics platform for ATP tennis: descriptive analytics, surface-specific Elo ratings, and interactive visualizations.

Personal workbench now, public-facing site later. Same codebase, same API.

## Architecture

```
tennis_web/
├── backend/           FastAPI + pandas analytics engine
│   ├── app/
│   │   ├── main.py            FastAPI routes
│   │   ├── service.py         In-memory data service (singleton)
│   │   ├── elo.py             Surface-specific Elo system
│   │   ├── analytics.py       Player stats, surface splits, H2H
│   │   ├── data_loader.py     Sackmann repo downloader
│   │   └── charts.py          (unused by API; kept for future PNG endpoints)
│   ├── Dockerfile             For Railway / Fly deployment
│   └── railway.json
├── frontend/          Next.js 15 + Tailwind + Recharts
│   ├── app/
│   │   ├── page.tsx           Homepage
│   │   ├── rankings/page.tsx  Surface rankings
│   │   ├── translation/       Hard-vs-clay scatter
│   │   ├── players/           Search + detail pages
│   │   └── h2h/page.tsx       Head-to-head comparison
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── PlayerSearch.tsx   Debounced autocomplete
│   │   ├── ui.tsx             Shared primitives
│   │   └── charts/            Recharts components
│   ├── lib/api.ts             Typed API client
│   └── vercel.json            For Vercel deployment
└── docker-compose.yml         One-command local dev
```

**Why this stack**
- **FastAPI** wraps the existing Python modules (Elo, analytics) as JSON endpoints without rewriting the math.
- **Next.js 15 + Recharts** gives you interactive client-rendered charts with zoom, hover, and filtering — not static PNGs.
- **React Query** handles data fetching, caching, and loading states cleanly.
- **Tailwind** tokens mirror the matplotlib palette exactly, so the web charts match the social-media chart identity.

## Local development

### Option A: Docker Compose (recommended)
```bash
docker compose up
```
- Backend: http://localhost:8000 (docs at /docs)
- Frontend: http://localhost:3000
- On first start, backend downloads ~20 years of ATP data from Sackmann's GitHub (~30 MB).

### Option B: Run separately

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`.

## API reference

Interactive Swagger docs: `http://localhost:8000/docs`

Key endpoints:
- `GET /players/search?q=sinner` — debounced autocomplete
- `GET /players/{id}` — bio + career totals + current Elo by surface
- `GET /players/{id}/surface-split` — serve/return stats by surface
- `GET /players/{id}/elo-history?surface=Clay` — full rating history
- `GET /rankings/{surface}?limit=25&min_matches=20` — top N by surface Elo
- `GET /translation?min_matches=30` — hard-vs-clay data for all qualifying players
- `GET /h2h?a={id}&b={id}` — complete match history between two players

## Deployment

### Backend → Railway
1. Push this repo to GitHub.
2. Create a new Railway project, "Deploy from GitHub repo."
3. Set root directory to `backend/` in service settings.
4. Railway auto-detects the Dockerfile and deploys.
5. Add a persistent volume mounted at `/app/data` so the match CSVs survive restarts (saves re-downloading on every deploy).
6. Copy the deployed URL (e.g., `https://baseline-api.up.railway.app`).

Alternative: Fly.io with `fly launch --dockerfile Dockerfile`.

### Frontend → Vercel
1. In Vercel, "Add New Project" → import the GitHub repo.
2. Set the project root to `frontend/`.
3. Add environment variable: `NEXT_PUBLIC_API_BASE` = your Railway backend URL.
4. Deploy.

### CORS
In `backend/app/main.py`, add your production Vercel URL to the `allow_origins` list before your first public deploy:
```python
allow_origins=[
    "http://localhost:3000",
    "https://your-domain.vercel.app",
]
```

## Customizing the brand

All visual tokens live in two files and are kept in sync:
- `backend/app/charts.py` — for any server-rendered PNG outputs (social media exports)
- `frontend/tailwind.config.js` and `frontend/app/globals.css` — for the web app

Change once, update both. Current palette:
- Background: warm off-white `#F4F1EA` (clay-court inspired)
- Primary accent: rust `#C2410C` (clay)
- Secondary: deep blue `#1E40AF` (hard), green `#15803D` (grass)
- Fonts: Fraunces (display serif) + Inter (body) + JetBrains Mono (labels)

## Path from personal → public

The architecture is already set up for this. To go public:
1. Add rate limiting to the backend (middleware like `slowapi`)
2. Tighten CORS to just your production frontend origin
3. Add basic caching headers on read endpoints
4. Consider adding an auth layer (Clerk / Supabase) if you want to gate some analyses
5. Add pre-rendered OG images for each player page (Next.js `opengraph-image.tsx` routes)

## What's not built yet

- WTA parallel (all infra is generic; just needs `tennis_wta` data)
- Match Charting Project integration for shot-level analytics
- Tournament draws and path-through-draw analyses
- Social-share export (PNG snapshot of any chart with your watermark)
- Server-side pre-computed translation data (currently recomputed per request; fine until traffic matters)

## Next steps

- `npm install` the frontend and `pip install -r requirements.txt` the backend
- Start both, visit `http://localhost:3000`
- Once it works locally, push to GitHub and deploy backend → Railway, frontend → Vercel
- Update the `@your_handle` watermark in `charts.py` when you've settled on a name
