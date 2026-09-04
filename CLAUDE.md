# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SATQUERY AI** — SIH 2026 project for ISRO: Multilingual conversational satellite image analysis assistant. A full-stack application with FastAPI backend, React/Vite frontend, and Python AI inference pipeline.

### Development Stages
- **Stage A (MVP)**: Auth, Projects, Image Upload, Chat, AI Routing, Analysis, Evidence, Map, Multilingual, Demo Mode — **IMPLEMENTED**
- **Stage B (Advanced)**: Real AI providers, advanced analysis, batch processing, collaboration
- **Stage C (Polish)**: Mobile PWA, voice input, export formats, performance optimization

---

## Commands

### Backend (FastAPI + Python)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server (with hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run production server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run single test
pytest tests/test_auth.py::test_register -v

# Lint
ruff check .

# Format
ruff format .

# Type check
mypy app/
```

### Frontend (React 18 + Vite + Tailwind)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run single test
npm test -- --run src/components/ImageUploader.test.jsx

# Lint
npm run lint

# Format
npm run format
```

### Database (SQLAlchemy + SQLite/PostgreSQL)

```bash
cd backend

# Create tables (auto-creates on startup via lifespan)
# Or manually:
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"

# Run migrations (if using Alembic)
alembic upgrade head
```

---

## Architecture

### High-Level Structure

```
satquery-ai/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes (auth, projects, images, chat, analysis, export)
│   │   ├── core/           # Core utilities (security, exceptions)
│   │   ├── database.py     # SQLAlchemy engine, session, Base
│   │   ├── config.py       # Pydantic Settings with .env loading
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic services
│   │   └── main.py         # FastAPI app, lifespan, CORS, static files
│   ├── ai/                 # AI inference pipeline (separate package)
│   │   ├── agent/          # Router, Planner
│   │   ├── inference/      # InferenceService orchestration
│   │   ├── preprocessing/  # Image loading, normalization, change detection
│   │   └── postprocessing/ # Evidence drawing (boxes, polygons, change maps)
│   └── requirements.txt
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/            # Axios instance + service modules
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth, Language)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service wrappers
│   │   ├── utils/          # Translations, helpers
│   │   ├── App.jsx         # Routing + layouts
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
└── SATQUERY_AI_SIH_BUILD.md  # Full specification (2054 lines)
```

### Key Architectural Patterns

#### 1. AI Provider Abstraction (`backend/app/services/ai_provider.py`)
- **Protocol-based**: `AIProvider` protocol with `chat`, `classify_query`, `analyze_images`, `embed`
- **Implementations**: `OpenAICompatibleProvider`, `GeminiProvider`, `DemoProvider`
- **Fallback chain**: Tries configured provider → falls back to deterministic router → DemoProvider
- **Configuration**: `AI_PROVIDER` env var (`openai`, `gemini`, `demo`)

#### 2. Deterministic Fallback Router (`ai/agent/router.py`)
- Keyword-based classification when LLM unavailable
- Intents: `OBJECT_DETECTION`, `CHANGE_DETECTION`, `LAND_USE_CLASSIFICATION`, `GENERAL`
- Extensible keyword lists per intent

#### 3. Analysis Pipeline (`ai/inference/inference_service.py`)
```
Query → Router (intent) → Planner (steps) → Executor (per step) → Evidence (visual overlays)
```
- `InferenceService.analyze()` orchestrates end-to-end
- Supports multi-image analysis (change detection needs 2+ images)
- Evidence: bounding boxes, polygons, change maps saved to `/evidence/` static route

#### 4. Multilingual Support (English, Hindi, Telugu)
- Frontend: `frontend/src/utils/translations.js` with `t(key, lang, params)` function
- Context: `LanguageContext.jsx` provides `language`, `setLanguage`, `t`
- Backend: `translation_service.py` for server-side translation
- Supported: `en`, `hi`, `te` — extensible to `ta`, `kn`, `ml`, `bn`, `mr`

#### 5. Storage Abstraction (`backend/app/services/storage_service.py`)
- `StorageService` protocol with `LocalStorage` and `SupabaseStorage` implementations
- Configured via `STORAGE_MODE` (`local` | `supabase`)
- Serves uploads at `/uploads/`, evidence at `/evidence/` via FastAPI static files

#### 6. Authentication (JWT + bcrypt)
- `auth_service.py`: register, login, password reset (token-based), token refresh
- `deps.py`: `get_current_user` dependency for protected routes
- Token expiry: `ACCESS_TOKEN_EXPIRE_MINUTES` (default 1440)
- Password hashing: bcrypt via `passlib`

#### 7. Project-Based Data Isolation
- Users own projects; images, chats, analyses scoped to project
- Public projects readable by all; private projects owner-only
- Ownership validated at service layer (`project_service.get_project`)

---

## Key Files to Understand

### Backend Entry Points
- `backend/app/main.py` — App factory, lifespan (DB init, static mounts), CORS, health endpoints
- `backend/app/config.py` — All settings via Pydantic, custom `.env` loading logic for AI_* vars

### Database Models (`backend/app/models/`)
| Model | Purpose |
|-------|---------|
| `User` | Auth, profile, settings |
| `Project` | Container for images/analyses, public/private |
| `Image` | Satellite image metadata + file_url, modality, geo coords |
| `ChatSession` | Conversation thread per project |
| `ChatMessage` | User/assistant messages with evidence JSON |
| `AnalysisResult` | Structured analysis output |
| `Detection` | Individual object detections |
| `ChangeResult` | Change detection results |

### API Routes (`backend/app/api/`)
| Module | Endpoints |
|--------|-----------|
| `auth.py` | `/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `/me` |
| `projects.py` | CRUD + list with pagination/filter/sort |
| `images.py` | Upload (multipart), list, get, delete |
| `chat.py` | Sessions CRUD, `/chat` (streams AI response) |
| `analysis.py` | `/analyze` (non-streaming), `/export` |
| `export.py` | Report generation (PDF/GeoJSON planned) |

### Frontend Core
- `frontend/src/main.jsx` — Providers: `AuthProvider`, `LanguageProvider`
- `frontend/src/App.jsx` — Routes with `ProtectedRoute`/`PublicRoute`, `MainLayout`/`PublicLayout`
- `frontend/src/context/AuthContext.jsx` — Token management, auto-refresh, user state
- `frontend/src/context/LanguageContext.jsx` — Language state, translation function
- `frontend/src/services/api.js` — Axios with JWT interceptor, FormData handling

### AI Pipeline
- `ai/agent/router.py` — `classify_query(query)` → `{intent, confidence, reasoning}`
- `ai/agent/planner.py` — `build_analysis_plan(intent, num_images, modalities)` → step list
- `ai/inference/inference_service.py` — `InferenceService.analyze()` main entry
- `ai/preprocessing/image_preprocessor.py` — `ImagePreprocessor`, `preprocess_image`, `compute_baseline_change`
- `ai/postprocessing/evidence.py` — `draw_bounding_boxes`, `draw_polygons`, `draw_change_map`, `create_evidence_package`

---

## Environment Variables

Create `backend/.env` (or root `.env`):

```env
# App
APP_NAME=SATQUERY AI
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=sqlite:///./satquery.db
# For PostgreSQL: postgresql://user:pass@localhost:5432/satquery

# AI Provider (choose one)
AI_PROVIDER=demo          # openai | gemini | demo
AI_BASE_URL=              # For OpenAI-compatible (e.g. http://localhost:11434/v1)
AI_API_KEY=               # API key for provider
AI_MODEL=                 # Model name (gpt-4o, gemini-1.5-pro, etc.)

# Storage
STORAGE_MODE=local        # local | supabase
STORAGE_PATH=./storage
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=

# CORS
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

---

## Development Workflow

### Adding a New API Endpoint
1. Define schema in `backend/app/schemas/`
2. Add service logic in `backend/app/services/`
3. Create route in `backend/app/api/`
4. Register router in `backend/app/main.py`

### Adding a New Analysis Capability
1. Add intent to `ai/agent/router.py` keyword lists
2. Add planning step in `ai/agent/planner.py`
3. Implement execution in `ai/agent/planner.py` → `execute_plan`
4. Add evidence drawing in `ai/postprocessing/evidence.py`
5. Update frontend `Analysis` page to handle new evidence types

### Adding a New Language
1. Add translation object to `frontend/src/utils/translations.js`
2. Add to `SUPPORTED_LANGUAGES` in `frontend/src/context/LanguageContext.jsx`
3. (Optional) Add backend translation in `backend/app/services/translation_service.py`

### Database Changes
- Modify models in `backend/app/models/`
- Create migration: `alembic revision --autogenerate -m "description"`
- Apply: `alembic upgrade head`

---

## Testing

### Backend
- `pytest` — all tests
- `pytest tests/test_auth.py` — specific module
- `pytest -k "test_login"` — keyword filter
- Tests use `TestClient` from FastAPI, override `get_db` with test SQLite

### Frontend
- `npm test` — Vitest + React Testing Library
- `npm test -- --run` — single run (no watch)
- Component tests in `src/components/__tests__/`

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `AI_MODEL` not picked up from `.env` | Custom loader in `config.py` prioritizes `.env` over system env for `AI_*` vars unless `ENVIRONMENT=test` |
| CORS errors | Check `CORS_ORIGINS` in `.env` matches frontend URL exactly |
| Static files 404 | Ensure `STORAGE_PATH` exists; evidence served at `/evidence/`, uploads at `/uploads/` |
| JWT expired | Token auto-refresh in `AuthContext.jsx`; check `ACCESS_TOKEN_EXPIRE_MINUTES` |
| Image upload fails | Check `MAX_UPLOAD_SIZE_MB`; verify `STORAGE_MODE` and credentials |
| Multilingual not working | Verify `language` in `LanguageContext`; check translation key exists in all languages |

---

## Key Dependencies

### Backend
- `fastapi`, `uvicorn` — API framework
- `sqlalchemy`, `alembic` — ORM + migrations
- `pydantic`, `pydantic-settings` — Validation + config
- `passlib[bcrypt]`, `python-jose` — Auth
- `pillow`, `opencv-python`, `rasterio`, `numpy`, `geopandas` — Image processing
- `httpx` — Async HTTP for AI providers
- `python-multipart` — File uploads

### Frontend
- `react`, `react-dom`, `react-router-dom` — UI + routing
- `vite` — Build tool
- `tailwindcss` — Styling
- `leaflet`, `react-leaflet` — Maps
- `axios` — HTTP client
- `vitest`, `@testing-library/react` — Testing
- `lucide-react` — Icons

---

## Project-Specific Notes

1. **Demo Mode**: `AI_PROVIDER=demo` returns deterministic responses for testing without API keys
2. **Baseline Change Detection**: Not a trained model — uses pixel difference thresholding; clearly labeled in responses
3. **Image Processing**: Handles GeoTIFF via rasterio, extracts geotransform for map overlay
4. **Evidence URLs**: Generated at runtime, served via FastAPI `StaticFiles` mount at `/evidence/` and `/uploads/`
5. **Multilingual Chat**: Frontend sends `language` header; backend uses `translation_service` for responses
6. **No WebSocket**: Chat uses HTTP streaming (`StreamingResponse`) for AI responses