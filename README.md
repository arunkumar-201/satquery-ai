# SATQUERY AI

> **SIH 2026 — Problem Statement 167**  
> *An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries*  
> **Organization:** ISRO | **Category:** Software | **Theme:** Space Technology

---

## 📋 Project Overview

SATQUERY AI is a web-based, multilingual conversational assistant for satellite image analysis. It enables users — without expert knowledge of remote sensing, GIS, SAR, or AI — to upload satellite imagery and ask natural-language questions to receive AI-powered analysis with visual evidence.

### Core Experience

```
User → Create Project → Upload Satellite Image → Select Language → Ask Question
                                        ↓
                              AI Query Router (Intent Classification)
                                        ↓
                              Analysis Engine (VQA / Detection / Grounding / Change)
                                        ↓
                              Evidence Generation (Boxes, Polygons, Change Maps, Coordinates)
                                        ↓
                              Multilingual Response → Chat
```

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Multilingual Chat** | English, Hindi, Telugu (extensible to Tamil, Kannada, Malayalam, Bengali, Marathi) |
| **AI Query Router** | Classifies queries into 10+ intents (Visual QA, Object Detection, Region Grounding, Change Detection, etc.) |
| **Provider Abstraction** | Supports Gemini, OpenAI-compatible APIs, and local Demo fallback — no vendor lock-in |
| **Evidence-Based Answers** | Bounding boxes, polygons, change maps, before/after comparison, geospatial coordinates |
| **Interactive Map** | Leaflet-based visualization with satellite/base layers, detections, and change regions |
| **Project Isolation** | User-owned projects with images, chat sessions, and analysis history |
| **Demo Mode** | Fully functional without external API keys — deterministic fallback router + baseline change detection |
| **Docker Ready** | Production `docker-compose.yml` with PostgreSQL/PostGIS, backend, frontend |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    U[User] --> F[React + Vite Frontend]
    F --> A[FastAPI Backend]
    A --> AUTH[Authentication Service]
    A --> DB[(PostgreSQL / PostGIS + SQLite Dev)]
    A --> ST[Storage Abstraction]
    A --> Q[AI Query Router]
    Q --> P[AI Provider]
    Q --> IMG[Image Analysis]
    Q --> DET[Object Detection]
    Q --> GR[Region Grounding]
    Q --> CH[Change Detection]
    Q --> CM[Cross-Modal Analysis]
    IMG --> E[Evidence Engine]
    DET --> E
    GR --> E
    CH --> E
    CM --> E
    E --> MAP[Leaflet Map]
    E --> VIS[Image Visualization]
    E --> CHAT[Chat Response]
    CHAT --> F
    
    subgraph "Frontend (React 18 + Vite + Tailwind)"
        F
    end
    
    subgraph "Backend (FastAPI + SQLAlchemy)"
        A
        AUTH
        DB
        ST
        Q
        P
        IMG
        DET
        GR
        CH
        CM
        E
    end
    
    subgraph "AI Pipeline (Python)"
        P
        IMG
        DET
        GR
        CH
        CM
        E
    end
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **Vite** — Modern SPA tooling
- **Tailwind CSS** — Utility-first styling (dark space-theme)
- **React Router v6** — Client-side routing with protected routes
- **Axios** — HTTP client with JWT interceptors
- **Leaflet + React-Leaflet** — Interactive maps
- **Lucide React** — Icon system
- **Vitest + React Testing Library** — Unit/integration tests

### Backend
- **FastAPI** — High-performance async API framework
- **SQLAlchemy 2.0** + **Alembic** — ORM with migrations
- **Pydantic v2** — Request/response validation & settings
- **JWT** (`python-jose`) + **bcrypt** (`passlib`) — Secure authentication
- **httpx** — Async HTTP for AI provider calls

### AI / Image Processing
- **Pillow** — Image loading & manipulation
- **OpenCV** — Computer vision operations
- **Rasterio** — GeoTIFF reading, geotransform extraction
- **NumPy** — Numerical computations
- **GeoPandas / Shapely** — Geospatial operations (when available)

### Infrastructure
- **Docker / Docker Compose** — Containerized deployment
- **PostgreSQL 16 + PostGIS 3.4** — Production database
- **SQLite** — Zero-config local development

---

## 📁 Project Structure

```
satquery-ai/
├── README.md
├── .env.example
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile
│   └── src/
│       ├── main.jsx                 # Entry point, providers
│       ├── App.jsx                  # Routing, layouts
│       ├── api/                     # Axios instance
│       ├── components/              # Reusable UI components
│       │   ├── ImageUploader.jsx    # Drag-drop, validation, metadata
│       │   ├── ImagePreview.jsx     # Thumbnail + metadata display
│       │   ├── ImageComparison.jsx  # Before/After slider
│       │   ├── MapViewer.jsx        # Leaflet map with overlays
│       │   ├── LanguageSelector.jsx # Flag + native name selector
│       │   ├── Navbar.jsx           # Top bar with auth, language
│       │   ├── Sidebar.jsx          # Navigation drawer
│       │   └── TypingIndicator.jsx  # AI thinking animation
│       ├── context/
│       │   ├── AuthContext.jsx      # JWT, user, auto-refresh
│       │   └── LanguageContext.jsx  # i18n state + t() function
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── Dashboard.jsx        # Stats + quick actions
│       │   ├── Projects.jsx         # List + create
│       │   ├── ProjectDetails.jsx   # Images, chat, analyses, map tabs
│       │   ├── Analysis.jsx         # Main chat + analysis UI
│       │   ├── History.jsx          # Session history
│       │   └── Settings.jsx         # User preferences
│       ├── services/                # API service wrappers
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── projectService.js
│       │   ├── imageService.js
│       │   ├── chatService.js
│       │   └── analysisService.js
│       ├── utils/
│       │   └── translations.js      # EN/HI/TE translation dictionary
│       └── styles/
│           └── index.css            # Tailwind + custom theme
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                         # Local config (not committed)
│   └── app/
│       ├── main.py                  # FastAPI app, lifespan, CORS, static files
│       ├── config.py                # Pydantic Settings with custom .env loader
│       ├── database.py              # Engine, session, Base, auto-create tables
│       ├── deps.py                  # FastAPI dependencies (get_current_user, get_db)
│       ├── api/                     # Route modules
│       │   ├── auth.py              # /register, /login, /refresh, /me, /forgot, /reset
│       │   ├── projects.py          # CRUD + list with pagination/filter/sort
│       │   ├── images.py            # Upload, list, get, delete
│       │   ├── chat.py              # Sessions, messages, /query, /ai/status
│       │   ├── analysis.py          # /analyze, /export
│       │   ├── history.py           # User history
│       │   └── export.py            # Report generation (JSON/GeoJSON)
│       ├── models/                  # SQLAlchemy models
│       │   ├── user.py
│       │   ├── project.py
│       │   ├── image.py
│       │   ├── chat.py
│       │   ├── analysis.py
│       │   ├── detection.py
│       │   └── change_result.py
│       ├── schemas/                 # Pydantic request/response models
│       ├── services/                # Business logic
│       │   ├── auth_service.py
│       │   ├── project_service.py
│       │   ├── image_service.py
│       │   ├── chat_service.py
│       │   ├── analysis_service.py
│       │   ├── ai_provider.py       # Protocol + Gemini/OpenAI/Demo implementations
│       │   ├── storage_service.py   # Local + Supabase storage abstraction
│       │   └── translation_service.py
│       └── utils/
│           ├── security.py          # JWT, password hashing
│           └── files.py             # Safe filenames, validation
│
├── ai/                              # AI Inference Pipeline
│   ├── agent/
│   │   ├── router.py                # Deterministic keyword-based intent classifier
│   │   ├── planner.py               # Analysis plan builder + executor
│   │   └── context.py               # Conversation context builder
│   ├── inference/
│   │   └── inference_service.py     # Orchestrates: Router → Planner → Executor → Evidence
│   ├── preprocessing/
│   │   └── image_preprocessor.py    # Load, normalize, baseline change detection
│   ├── postprocessing/
│   │   └── evidence.py              # Draw boxes, polygons, change maps, packages
│   └── models/                      # Model adapters (detection, grounding, VQA, etc.)
│
└── storage/                         # Local file storage (gitignored)
    ├── uploads/
    ├── evidence/
    ├── processed/
    └── reports/
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.11+**
- **Docker & Docker Compose** (for production stack)

### Local Development (No Docker)

#### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Copy and edit .env (or use defaults — Demo Mode works out of the box)
cp ../.env.example .env

# Start server (auto-creates SQLite tables)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

#### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

### Production with Docker

```bash
# From project root
docker-compose up --build -d

# Services:
# - postgres (PostGIS) on port 5432
# - backend on port 8000
# - frontend on port 5173
```

**Environment variables** (set in `.env` or shell):
```bash
# Required for production AI
AI_PROVIDER=gemini              # or openai_compatible
AI_API_KEY=your-api-key
AI_MODEL=gemini-1.5-pro         # or gpt-4o, etc.
AI_BASE_URL=                    # For OpenAI-compatible endpoints

# Database (Docker Compose sets this automatically)
DATABASE_URL=postgresql+psycopg://satquery:satquery@postgres:5432/satquery

# Storage
STORAGE_MODE=local              # or supabase
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_BUCKET=satquery

# Security
SECRET_KEY=generate-a-secure-random-key
```

---

## 🔐 Environment Configuration

Create `.env` from `.env.example`:

```env
# Application
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
# Production: postgresql+psycopg://user:pass@host:5432/satquery

# AI Provider: demo | gemini | openai_compatible
AI_PROVIDER=demo
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=

# Storage: local | supabase
STORAGE_MODE=local
STORAGE_PATH=./storage
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=satquery

# CORS
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

### AI Provider Options

| Provider | Env Vars Required | Notes |
|----------|-------------------|-------|
| **demo** | (none) | Deterministic fallback, baseline change detection — **works offline** |
| **gemini** | `AI_API_KEY`, `AI_MODEL` | Google Generative Language API |
| **openai_compatible** | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | OmniRoute, LocalAI, vLLM, OpenAI, etc. |

---

## 🧪 Testing

### Backend
```bash
cd backend
.venv\Scripts\activate  # or source .venv/bin/activate
pytest -v

# Run specific test
pytest tests/test_smoke.py::test_upload_query_history_workflow -v
```

### Frontend
```bash
cd frontend
npm test              # Watch mode
npm test -- --run     # Single run (CI)
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/forgot-password` | Request reset token |
| POST | `/api/auth/reset-password` | Reset with token |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List (paginated, filter, sort) |
| GET | `/api/projects/{id}` | Get project |
| DELETE | `/api/projects/{id}` | Delete project |

### Images
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/upload` | Multipart upload with metadata |
| GET | `/api/images/project/{project_id}` | List project images |
| GET | `/api/images/{id}` | Get image metadata |
| DELETE | `/api/images/{id}` | Delete image |

### Chat & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/query` | Send query (streaming) |
| POST | `/api/query` | Send query (non-streaming) |
| GET | `/api/chat/sessions/{project_id}` | List chat sessions |
| GET | `/api/chat/sessions/{session_id}/messages` | Get messages |
| GET | `/api/history` | User's full history |
| GET | `/api/ai/status` | AI provider status |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/project/{project_id}/json` | Project export |
| GET | `/api/export/analysis/{analysis_id}/json` | Analysis export |
| GET | `/api/export/analysis/{analysis_id}/geojson` | GeoJSON export |

### Health
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{"status": "ok"}` |

---

## 🌍 Multilingual Support

| Language | Code | Native Name | Flag |
|----------|------|-------------|------|
| English | `en` | English | 🇺🇸 |
| Hindi | `hi` | हिंदी | 🇮🇳 |
| Telugu | `te` | తెలుగు | 🇮🇳 |

**Extensible:** Add translations to `frontend/src/utils/translations.js` and `LanguageContext.jsx`.

---

## 🎯 SIH Demo Flow (15 Steps)

The project is designed for this live demonstration:

1. **Open** SATQUERY AI at http://localhost:5173
2. **Register** or **Login**
3. **Create Project:** "Urban Growth Analysis – Visakhapatnam"
4. **Upload** a satellite image (Optical/SAR/GeoTIFF)
5. **Select Language:** English 🇺🇸
6. **Ask:** "What is visible in this image?"
7. **Show** AI analysis (Visual QA)
8. **Ask:** "Where are the buildings?"
9. **Show** evidence (Region Grounding — bounding boxes/regions)
10. **Select Language:** తెలుగు 🇮🇳
11. **Ask follow-up in Telugu:** "ఈ చిత్రం ఏమి చూపిస్తుంది?"
12. **Show** answer in Telugu
13. **Upload** second image (same area, different date)
14. **Ask:** "What changed between these images?"
15. **Show:** Before / After / Change Map / Explanation (Change Detection)

---

## 🐳 Docker Deployment

### Backend Dockerfile (`backend/Dockerfile`)
- Python 3.11 slim base
- System deps: GDAL, GEOS, PROJ, libgl1, OpenCV headless
- Non-root user (`app`)
- Health check on `/health`
- Exposes port 8000

### Frontend Dockerfile (`frontend/Dockerfile`)
- Node 20 Alpine build stage
- Vite production build
- Nginx serve stage with SPA fallback
- Exposes port 5173

### Docker Compose (`docker-compose.yml`)
```yaml
services:
  postgres:    # postgis/postgis:16-3.4
  backend:     # builds from backend/Dockerfile
  frontend:    # builds from frontend/Dockerfile
```

**Start:**
```bash
docker-compose up --build -d
```

**Stop:**
```bash
docker-compose down
```

**With volumes cleanup:**
```bash
docker-compose down -v
```

---

## 🔒 Security

- **Password hashing:** bcrypt (cost factor 12)
- **JWT tokens:** HS256, 24-hour expiry (configurable), refresh token rotation
- **Protected endpoints:** All API routes require valid JWT via `Authorization: Bearer` header
- **Ownership validation:** Users only access their own projects/images/chats/analyses
- **File upload validation:** MIME type allowlist (PNG, JPEG, TIFF), 50MB limit, safe filename generation
- **CORS:** Configured via `CORS_ORIGINS`
- **Secrets:** Never committed — loaded from `.env` only
- **No API keys in frontend:** All provider credentials server-side only

---

## 📦 Storage Abstraction

```python
# Usage
from app.services.storage_service import get_storage
storage = get_storage()

# Upload
url = await storage.save(file_obj, "uploads/project_1/image.tif")

# Delete
await storage.delete("uploads/project_1/image.tif")

# Get public URL
url = storage.get_public_url("uploads/project_1/image.tif")
```

**Implementations:**
- `LocalStorage` — Filesystem under `STORAGE_PATH` (default `./storage`)
- `SupabaseStorage` — S3-compatible via Supabase (configure `SUPABASE_*` vars)

---

## 🤖 AI Pipeline Details

### Query Router (`ai/agent/router.py`)
Deterministic keyword-based classifier (fallback when LLM unavailable):
- Intents: `VISUAL_QA`, `OBJECT_DETECTION`, `REGION_GROUNDING`, `CHANGE_DETECTION`, `IMAGE_ANALYSIS`, `IMAGE_CAPTIONING`, `MULTITEMPORAL_ANALYSIS`, `CROSS_MODAL_ANALYSIS`, `LAND_COVER_ANALYSIS`, `GENERAL`

### Planner (`ai/agent/planner.py`)
Builds execution plan from intent:
- Single image → VQA / Detection / Grounding
- Two images → Change Detection / Cross-Modal

### Inference Service (`ai/inference/inference_service.py`)
Orchestrates end-to-end:
```
Query → Router → Planner → Executor (per step) → Evidence Package
```

### Evidence (`ai/postprocessing/evidence.py`)
- `draw_bounding_boxes()` — PIL rectangles + labels
- `draw_polygons()` — Shapely polygons → image overlays
- `draw_change_map()` — Diff heatmap + region extraction
- `create_evidence_package()` — Saves to `/evidence/`, returns URLs

---

## ⚠️ Limitations & Known Gaps

| Area | Limitation |
|------|------------|
| **Object Detection** | No trained model bundled — returns empty detections with clear "model not configured" message |
| **Region Grounding** | Requires compatible model; demo mode returns structured empty result |
| **Change Detection** | Baseline pixel-diff only — **not a trained satellite foundation model** (clearly labeled) |
| **Cross-Modal (Optical+SAR)** | Modality-aware comparison only; no learned fusion |
| **Geospatial Accuracy** | Coordinates only when image has valid GeoTIFF metadata |
| **Export Formats** | JSON/GeoJSON implemented; PDF reports pending |
| **Frontend Dockerfile** | Created but not integration-tested in compose |
| **Seed Data** | No automated demo seed script |

---

## 🗺️ Future Enhancements

- Real detection/grounding model adapters (YOLO, SAM, RT-DETR)
- Trained change detection model (e.g., Siamese U-Net, ChangeFormer)
- PDF report generation with map + evidence + narrative
- WebSocket-based real-time chat streaming
- Collaboration: shared projects, comments
- Mobile PWA with voice input
- More languages (Tamil, Kannada, Malayalam, Bengali, Marathi)
- Time-series analysis (3+ images)
- Vector tile layer for large-scale map rendering

---

## 📄 License

This project is developed for **Smart India Hackathon 2026** under ISRO Problem Statement 167.

---

## 🤝 Acknowledgments

- **ISRO** — Problem statement and domain expertise
- **Open Source**: FastAPI, React, Leaflet, Tailwind, GDAL, Rasterio, GeoPandas communities
- **AI Providers**: Google (Gemini), OpenAI-compatible ecosystem

---

## 📞 Support

For SIH 2026 evaluation queries, contact the development team through the hackathon platform.

---

**Built for ISRO | SIH 2026 | Space Technology**