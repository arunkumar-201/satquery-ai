SATQUERY AI — SIH 2026

Complete Build Specification & Implementation Prompt

Goal: Build a fully runnable, demo-ready Smart India Hackathon project for
Problem Statement 167: SatQuery AI – An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries
Organization: ISRO
Category: Software
Theme: Space Technology

1. Product Vision

SATQUERY AI is a web-based, multilingual conversational assistant for satellite-image analysis.

The user should not need expert knowledge of remote sensing, GIS, SAR, image processing, or AI.

The primary experience is:

USER
  │
  ├── Create project
  │
  ├── Upload satellite image
  │
  ├── Select language
  │
  └── Ask a natural-language question
          │
          ▼
   QUERY UNDERSTANDING
          │
          ▼
      AI ROUTER
          │
          ├── Image understanding
          ├── Object detection
          ├── Region grounding
          └── Change detection
          │
          ▼
    ANALYSIS ENGINE
          │
          ▼
   EVIDENCE GENERATION
          │
          ├── Answer
          ├── Confidence
          ├── Highlighted image
          ├── Bounding boxes
          ├── Change map
          └── Coordinates when available
          │
          ▼
   USER LANGUAGE RESPONSE
          │
          ▼
        CHAT

The system must prioritize real working functionality over the number of features.

Do not create fake buttons, dead routes, disconnected APIs, or placeholder pages that pretend to work.

2. Critical Implementation Rule

Build the project in stages.

Stage A — Working MVP

The first runnable version MUST provide:

Register

Login

Logout

Protected routes

Dashboard

Create project

Upload satellite image

Image preview

Language selection

Chat interface

Natural-language query

AI query router

Single-image analysis

At least one real image-analysis capability

Answer generation

Confidence

Evidence visualization

Map when coordinates are available

Chat history

Follow-up questions

Stage B — Advanced Analysis

After Stage A works:

Object detection

Region grounding

Change detection

Before/after comparison

Optical + SAR comparison

Multilingual responses

Better geospatial visualization

Stage C — Polish

Finally:

Reports

Export

Advanced history

Settings

Better error handling

Docker

Deployment

Performance improvements

UI polish

Never sacrifice Stage A functionality to implement Stage B/C features.

3. Required Technology Stack

Frontend

React

Vite

Tailwind CSS

React Router

Axios

Leaflet

React Leaflet

Backend

Python

FastAPI

Pydantic

SQLAlchemy

JWT authentication

Database

PostgreSQL

PostGIS where available

Storage

Use a simple configurable storage abstraction.

Support:

Local development storage

Supabase Storage or S3-compatible storage in deployment

The application must work locally without requiring cloud storage.

AI

Use a provider abstraction.

The application must support:

OpenAI-compatible API

OmniRoute/OpenAI-compatible endpoint through environment variables

Local/mock analysis fallback for development

Do NOT hard-code API keys.

Image/Geospatial Processing

Use:

Pillow

OpenCV

Rasterio

NumPy

GeoPandas where required

GDAL only where installation is practical

If an optional geospatial dependency is unavailable, the basic image workflow must still work.

4. Project Structure

Create:

satquery-ai/
│
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       │
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── LanguageSelector.jsx
│       │   ├── ImageUploader.jsx
│       │   ├── ImagePreview.jsx
│       │   ├── ImageComparison.jsx
│       │   ├── ChatWindow.jsx
│       │   ├── ChatMessage.jsx
│       │   ├── ChatInput.jsx
│       │   ├── TypingIndicator.jsx
│       │   ├── AnalysisLoader.jsx
│       │   ├── ResultCard.jsx
│       │   ├── EvidencePanel.jsx
│       │   ├── ConfidenceBadge.jsx
│       │   ├── MapViewer.jsx
│       │   ├── ChangeMap.jsx
│       │   ├── BoundingBoxOverlay.jsx
│       │   ├── ProjectCard.jsx
│       │   └── HistoryCard.jsx
│       │
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetails.jsx
│       │   ├── Analysis.jsx
│       │   ├── History.jsx
│       │   └── Settings.jsx
│       │
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── LanguageContext.jsx
│       │   └── ChatContext.jsx
│       │
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── projectService.js
│       │   ├── imageService.js
│       │   ├── chatService.js
│       │   └── analysisService.js
│       │
│       └── styles/
│           └── index.css
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       │
│       ├── api/
│       │   ├── auth.py
│       │   ├── users.py
│       │   ├── projects.py
│       │   ├── images.py
│       │   ├── chat.py
│       │   ├── analysis.py
│       │   ├── history.py
│       │   └── export.py
│       │
│       ├── models/
│       │   ├── user.py
│       │   ├── project.py
│       │   ├── image.py
│       │   ├── chat.py
│       │   ├── analysis.py
│       │   ├── detection.py
│       │   └── change_result.py
│       │
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── project.py
│       │   ├── image.py
│       │   ├── chat.py
│       │   └── analysis.py
│       │
│       ├── services/
│       │   ├── auth_service.py
│       │   ├── project_service.py
│       │   ├── image_service.py
│       │   ├── chat_service.py
│       │   ├── analysis_service.py
│       │   ├── translation_service.py
│       │   └── storage_service.py
│       │
│       └── utils/
│           ├── security.py
│           └── files.py
│
├── ai/
│   ├── agent/
│   │   ├── router.py
│   │   ├── planner.py
│   │   └── context.py
│   │
│   ├── models/
│   │   ├── base.py
│   │   ├── image_analysis.py
│   │   ├── vqa.py
│   │   ├── detection.py
│   │   ├── grounding.py
│   │   ├── change_detection.py
│   │   └── cross_modal.py
│   │
│   ├── preprocessing/
│   │   └── image_preprocessor.py
│   │
│   ├── postprocessing/
│   │   └── evidence.py
│   │
│   └── inference/
│       └── inference_service.py
│
├── storage/
│   ├── uploads/
│   ├── processed/
│   ├── evidence/
│   └── reports/
│
└── tests/
    ├── backend/
    └── frontend/

5. Environment Configuration

Create .env.example:

# Application
APP_NAME=SATQUERY AI
ENVIRONMENT=development
SECRET_KEY=change-this-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=sqlite:///./satquery.db
# PostgreSQL example:
# DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/satquery

# AI Provider
AI_PROVIDER=openai_compatible
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=

# OmniRoute/OpenAI-compatible endpoint
# Example:
# AI_BASE_URL=http://127.0.0.1:20128/v1
# AI_API_KEY=your-key
# AI_MODEL=your-model

# Storage
STORAGE_MODE=local
STORAGE_PATH=./storage

# Optional cloud storage
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET=

# CORS
CORS_ORIGINS=http://localhost:5173

Never commit real secrets.

6. Authentication

Implement secure authentication.

Required:

Register

Login

Logout

Password hashing

JWT access token

Protected routes

Current-user endpoint

User ownership checks

Registration:

Full Name
Email
Password
Confirm Password

Login:

Email
Password

JWT must be validated on protected backend endpoints.

Users must only see:

Their own projects

Their own images

Their own chats

Their own analysis results

Never trust a user-provided user_id.

Derive the user from the authenticated token.

7. Frontend Routes

Implement:

/login
/register
/forgot-password
/dashboard
/projects
/projects/:id
/analysis/:id
/history
/settings

Unauthenticated users trying to access protected routes must be redirected to /login.

Authenticated users should be redirected to /dashboard.

8. Dashboard

Display:

Welcome, <user>

Total Projects
Total Analyses
Uploaded Images
Recent Activity

Primary actions:

+ New Project
+ Upload Image
Open AI Assistant
View History

The dashboard should feel like a professional satellite intelligence application.

Use a clean visual language:

Dark space-inspired UI

Strong typography

Cards

Clear hierarchy

Satellite imagery previews

Map-oriented visuals

Responsive layout

Do not make it look like a generic CRUD admin panel.

9. Project Management

Users can create:

Project Name
Description

Example:

Urban Growth Analysis – Visakhapatnam

Each project contains:

Images
Chat
Analyses
Maps
History

Implement:

POST /api/projects
GET /api/projects
GET /api/projects/{id}
DELETE /api/projects/{id}

All project operations must enforce ownership.

10. Image Upload

Support:

PNG
JPG
JPEG
GeoTIFF

Allow:

One image

Two images

Multiple images

Store metadata:

filename
file_url
modality
sensor
acquisition_date
latitude
longitude
resolution
bounding_box
project_id

Image modalities:

OPTICAL
SAR
MULTISPECTRAL
OTHER

For local development, store uploaded files under:

storage/uploads/

Never store large binary images directly inside the database.

11. Image Processing

Create a reusable preprocessing pipeline:

Upload
  ↓
Validate
  ↓
Read metadata
  ↓
Normalize
  ↓
Resize when necessary
  ↓
Create analysis-ready image
  ↓
Run inference
  ↓
Generate evidence

Do not destroy the original image.

12. Natural-Language Query Router

This is the core AI orchestration layer.

The router must classify user queries into:

IMAGE_ANALYSIS
IMAGE_CAPTIONING
VISUAL_QA
OBJECT_DETECTION
REGION_GROUNDING
CHANGE_DETECTION
MULTITEMPORAL_ANALYSIS
CROSS_MODAL_ANALYSIS
LAND_COVER_ANALYSIS
GENERAL

Examples:

"What is in this image?"
→ IMAGE_ANALYSIS

"Describe this image."
→ IMAGE_CAPTIONING

"Where are the buildings?"
→ REGION_GROUNDING

"How many buildings are visible?"
→ OBJECT_DETECTION

"What changed between these images?"
→ CHANGE_DETECTION

"How did this area change over time?"
→ MULTITEMPORAL_ANALYSIS

"Compare the optical and SAR images."
→ CROSS_MODAL_ANALYSIS

The router must return structured JSON internally:

{
  "intent": "OBJECT_DETECTION",
  "confidence": 0.94,
  "reason": "The user asks for the number and locations of buildings.",
  "required_images": 1
}

If the LLM is unavailable, use a deterministic fallback router based on keywords.

The application must continue to work.

13. AI Provider Abstraction

Do not couple the entire application to one AI provider.

Create:

class AIProvider:
    async def chat(self, messages):
        ...

    async def analyze_image(self, image, prompt):
        ...

    async def classify_query(self, query):
        ...

Implement an OpenAI-compatible provider.

The provider must read:

AI_BASE_URL
AI_API_KEY
AI_MODEL

from environment variables.

This allows OmniRoute or another OpenAI-compatible gateway to be used without changing the application architecture.

14. Real Analysis Requirement

Do not fake AI results.

For development fallback, it is acceptable to provide a clearly labeled deterministic/demo analysis.

However:

Do not claim a random result is AI inference.

Do not generate fake confidence values and present them as model confidence.

Label fallback results as DEMO / FALLBACK ANALYSIS.

When a real model is configured, use the real model output.

15. Single Image Analysis

The MVP must support at least one actual image-analysis path.

Pipeline:

User Question
     ↓
Query Router
     ↓
IMAGE_ANALYSIS / VISUAL_QA
     ↓
AI Provider
     ↓
Structured Result
     ↓
Evidence
     ↓
Natural Language Answer

Return:

{
  "analysis_type": "IMAGE_ANALYSIS",
  "answer": "...",
  "confidence": 0.0,
  "evidence": {
    "boxes": [],
    "polygons": [],
    "highlighted_image_url": null
  }
}

Confidence must only be returned when supported by the analysis. Otherwise return null and explain that confidence is unavailable.

16. Object Detection

Implement a model adapter architecture.

Interface:

class DetectionModel:
    def predict(self, image):
        ...

Output:

{
  "detections": [
    {
      "class_name": "building",
      "confidence": 0.91,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}

The UI must display:

Bounding boxes

Class names

Confidence

Detection count

If no detection model is configured, display:

Object detection model is not configured.

Do not pretend that detection happened.

17. Region Grounding

Allow queries such as:

Where are the buildings?
Show me the roads.
Where is the water body?

Return regions when the configured model supports grounding.

Example:

{
  "regions": [
    {
      "label": "building region",
      "confidence": 0.88,
      "bbox": [100, 120, 240, 300]
    }
  ]
}

Render overlays over the image.

18. Change Detection

This is a major SIH feature.

Inputs:

IMAGE A
IMAGE B

Pipeline:

Image A
Image B
   ↓
Preprocessing
   ↓
Alignment
   ↓
Normalization
   ↓
Difference / Change Model
   ↓
Change Mask
   ↓
Changed Region Extraction
   ↓
Visualization
   ↓
Natural Language Explanation

Return:

Before image
After image
Change map
Changed regions
Explanation

Implement a practical baseline using image registration/normalization and pixel or feature differences when a trained change-detection model is unavailable.

Clearly label the baseline as:

Baseline Change Detection

Do not claim it is a trained satellite foundation model.

19. Optical + SAR

Allow two images:

OPTICAL
+
SAR

The system should identify modalities from user metadata when available.

Pipeline:

Optical Analysis
       +
SAR Analysis
       ↓
Feature / Result Fusion
       ↓
Cross-Modal Reasoning
       ↓
Answer
       ↓
Evidence

If no dedicated cross-modal model is configured, provide a transparent modality-aware comparison rather than inventing a fusion model.

20. Multilingual Support

Initial languages:

English
Telugu
Hindi

Architecture must allow future:

Tamil
Kannada
Malayalam
Bengali
Marathi

Language selector must appear in:

Navbar

Chat

Settings

Pipeline:

User Language
      ↓
Language Detection
      ↓
Query Understanding
      ↓
AI Analysis
      ↓
Answer Generation
      ↓
Translation
      ↓
Selected Language

If the configured AI provider can understand the selected language directly, prefer direct multilingual prompting.

Otherwise use a translation layer.

Never hard-code only English assumptions into the chat flow.

21. Chat Context

The assistant must maintain project-level conversation context.

Example:

User:
What changed?

AI:
Significant changes were detected in the northern region.

User:
What type of change?

AI:
The detected change appears to be ...

User:
Show me.

AI:
[Displays evidence]

Store:

chat_sessions
chat_messages

Each message contains:

role
message
language
created_at

The backend must send relevant recent conversation context to the AI provider.

Do not send unlimited history. Use a configurable context window.

22. Chat API

Implement:

POST /api/query
GET /api/query/{id}
GET /api/history

Example request:

{
  "project_id": 1,
  "image_ids": [10],
  "message": "Where are the buildings?",
  "language": "en"
}

Example response:

{
  "query_id": 100,
  "analysis_type": "OBJECT_DETECTION",
  "answer": "Buildings were detected in several regions.",
  "confidence": null,
  "evidence": {
    "boxes": []
  }
}

23. Evidence Engine

AI answers must be accompanied by evidence whenever the selected analysis supports it.

Evidence can include:

Answer
Confidence
Bounding boxes
Polygons
Coordinates
Highlighted image
Change map
Before/after comparison

Never fabricate evidence.

If evidence is unavailable:

No visual evidence was produced by this analysis.

24. Map

Use Leaflet / React Leaflet.

Display:

Satellite/map base layer

Detected points

Bounding boxes

Polygons

Changed regions

Coordinates

If image geographic metadata is available, use actual geographic coordinates.

If metadata is unavailable:

Geospatial coordinates are unavailable for this image.

Do not invent coordinates.

25. Database Schema

Use SQLAlchemy models.

users

id
name
email
password_hash
created_at

projects

id
user_id
name
description
created_at

images

id
project_id
filename
file_url
modality
sensor
acquisition_date
latitude
longitude
bounding_box
created_at

chat_sessions

id
user_id
project_id
language
created_at

chat_messages

id
session_id
role
message
language
created_at

analysis_results

id
project_id
query_id
analysis_type
answer
confidence
result_url
created_at

detections

id
analysis_id
class_name
confidence
geometry

change_results

id
analysis_id
before_image_id
after_image_id
change_map_url
geometry

Use PostGIS geometry columns when PostgreSQL/PostGIS is enabled.

26. API Endpoints

Implement:

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/users/me

POST   /api/projects
GET    /api/projects
GET    /api/projects/{id}
DELETE /api/projects/{id}

POST   /api/images/upload
GET    /api/images/{id}

POST   /api/query
GET    /api/query/{id}

POST   /api/analysis
GET    /api/analysis/{id}

GET    /api/history

POST   /api/export

GET    /health

GET /health must return:

{
  "status": "ok"
}

27. Error Handling

Every API must return useful errors.

Examples:

{
  "detail": "Project not found"
}

{
  "detail": "You do not have access to this project"
}

{
  "detail": "Unsupported image format"
}

{
  "detail": "Two images are required for change detection"
}

Frontend must show human-readable error messages.

Never expose stack traces to users.

28. Security

Implement:

Password hashing

JWT authentication

Protected endpoints

Ownership validation

File-type validation

File-size limits

Safe filenames

CORS configuration

Environment-based secrets

No API keys in frontend source

Never put:

AI_API_KEY
SECRET_KEY
DATABASE_PASSWORD

inside React code.

29. File Upload Security

Allowed MIME/types:

image/png
image/jpeg
image/jpg
image/tiff

Set a configurable maximum upload size.

Generate safe server-side filenames.

Do not trust the client filename.

Reject unsupported files.

30. Frontend UX

The application must be responsive.

Important states:

Loading
Uploading
Analyzing
Success
Error
Empty
No data
Model unavailable

Chat must have:

User messages

AI messages

Timestamp

Loading indicator

Error state

Evidence cards

Follow-up questions

Analysis screen should visually separate:

Question
Analysis Type
Answer
Evidence
Confidence
Map
Image

31. Project Details Page

Layout:

----------------------------------------------------
Project Name
Description
----------------------------------------------------

Images        Chat        Analyses        Map

----------------------------------------------------
Uploaded Images
----------------------------------------------------

[Image 1] [Image 2] [Image 3]

----------------------------------------------------
AI Assistant
----------------------------------------------------

User: Where are the buildings?

AI: Buildings were detected...

----------------------------------------------------
Evidence
----------------------------------------------------

[Highlighted Image]

----------------------------------------------------
Map
----------------------------------------------------

32. Analysis Result Model

Use a common result structure:

{
  "analysis_id": 1,
  "analysis_type": "OBJECT_DETECTION",
  "answer": "Several building regions were detected.",
  "confidence": null,
  "evidence": {
    "boxes": [],
    "polygons": [],
    "coordinates": [],
    "image_url": null,
    "change_map_url": null
  },
  "metadata": {
    "model": null,
    "provider": null,
    "is_fallback": false
  }
}

The UI should gracefully handle missing fields.

33. Demo/Fallback Mode

The application MUST run even without an external AI key.

Set:

AI_PROVIDER=demo

In demo mode:

Query router works with deterministic rules.

Image upload works.

Project system works.

Chat history works.

Basic image statistics can be calculated.

Baseline change detection can run.

Evidence can be generated from actual image processing where appropriate.

Clearly display:

Demo Mode

Never call demo output "AI model prediction".

34. AI Mode

When configured:

AI_PROVIDER=openai_compatible
AI_BASE_URL=...
AI_API_KEY=...
AI_MODEL=...

Use the configured provider.

The application should detect provider availability through:

GET /health

and optionally:

GET /api/ai/status

Return:

{
  "provider": "openai_compatible",
  "configured": true,
  "model": "..."
}

Never expose the API key.

35. Docker

Create:

backend/Dockerfile
docker-compose.yml

Local Docker setup should include:

frontend
backend
postgres

If PostGIS is available, prefer a PostGIS-enabled PostgreSQL image.

However, local non-Docker development should remain possible.

36. Development Commands

Backend

Windows:

cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Frontend

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

Backend:

http://localhost:8000

Swagger:

http://localhost:8000/docs

37. Database Development

The application must automatically create development tables when configured for local development.

Do not require the user to manually create 20 tables before the first run.

For production, provide migration support.

38. Testing

Create tests for:

Backend

Health endpoint

Registration

Login

Invalid login

Protected endpoint

Project creation

Project ownership

Image upload validation

Query routing

Chat history

Change detection input validation

Frontend

Login page

Register page

Protected navigation

Project creation

Image upload

Chat rendering

Result rendering

At minimum, provide a smoke-test path.

39. Seed/Demo Data

Provide an optional demo seed script.

It should create:

Demo User
Demo Project
Demo Analysis

Do not include copyrighted or sensitive satellite data without permission.

The demo should work with user-provided images.

40. README Requirements

Create a professional README containing:

Project Overview
Problem Statement
Solution
Key Features
Architecture
Technology Stack
Project Structure
Installation
Environment Variables
Running Locally
AI Configuration
Demo Mode
API Documentation
Database
Security
Testing
Docker
Deployment
Limitations
Future Enhancements
SIH Demo Flow

Also include an architecture diagram using Mermaid.

41. Architecture Diagram

Include:

flowchart TD
    U[User] --> F[React Frontend]

    F --> A[FastAPI Backend]

    A --> AUTH[Authentication]
    A --> DB[(PostgreSQL/PostGIS)]
    A --> ST[Storage]
    A --> Q[AI Query Router]

    Q --> P[AI Provider]

    Q --> IMG[Image Analysis]
    Q --> DET[Object Detection]
    Q --> GR[Region Grounding]
    Q --> CH[Change Detection]
    Q --> CM[Optical + SAR]

    IMG --> E[Evidence Engine]
    DET --> E
    GR --> E
    CH --> E
    CM --> E

    E --> MAP[Leaflet Map]
    E --> VIS[Image Visualization]
    E --> CHAT[Chat Response]

    CHAT --> F

42. SIH Demonstration Flow

The final project must support this live demonstration:

Step 1

Open SATQUERY AI.

Step 2

Register or login.

Step 3

Create:

Urban Growth Analysis – Visakhapatnam

Step 4

Upload a satellite image.

Step 5

Select:

English

Step 6

Ask:

What is visible in this image?

Step 7

Show AI analysis.

Step 8

Ask:

Where are the buildings?

Step 9

Show evidence/bounding boxes if the configured model supports detection/grounding.

Step 10

Select:

తెలుగు

Step 11

Ask a follow-up question in Telugu.

Step 12

Show the answer in Telugu.

Step 13

Upload a second image.

Step 14

Ask:

What changed between these images?

Step 15

Show:

Before
After
Change Map
Explanation

This should be the primary SIH story.

43. UI Design Direction

Create a polished professional space-tech interface.

Visual direction:

Space Technology
+
Geospatial Intelligence
+
Modern AI Assistant

Suggested design:

Dark navy/black background

Subtle grid

Satellite imagery cards

Glass-like panels used sparingly

Clear accent colors

Map interface

AI status indicators

Clean typography

Smooth transitions

Do not overuse animations.

Do not sacrifice usability for visual effects.

44. Accessibility

Implement:

Semantic HTML

Keyboard navigation

Labels for form inputs

Visible focus states

Accessible buttons

Good contrast

Alt text for meaningful images

Error messages connected to fields

45. Performance

Optimize:

Image previews

API requests

Chat history

Large image handling

Lazy-loaded pages

Frontend bundle

Do not send original huge images to the AI provider unnecessarily.

Resize/compress when the analysis provider supports it.

46. Observability

Backend logs should include:

timestamp
request
user id
project id
analysis type
duration
success/failure

Never log:

password
JWT token
AI API key

47. Implementation Order

Follow this exact order.

Phase 1 — Foundation

Create repository
Create frontend
Create backend
Create environment configuration
Create database layer
Create health endpoint

Phase 2 — Authentication

Register
Login
JWT
Logout
Protected routes
Current user

Phase 3 — Projects

Create project
List projects
Project details
Delete project
Ownership

Phase 4 — Images

Upload
Validation
Storage
Metadata
Preview

Phase 5 — Chat

Chat UI
Chat API
Session
Messages
History

Phase 6 — AI Router

Intent classification
Fallback router
Provider abstraction

Phase 7 — Analysis

Single image analysis
Evidence
Result storage

Phase 8 — Map

Leaflet
Coordinates
Bounding boxes
Polygons

Phase 9 — Multilingual

English
Telugu
Hindi

Phase 10 — Advanced

Detection
Grounding
Change detection
Optical + SAR

Phase 11 — Production

Tests
Docker
Security
Error handling
Deployment
Documentation

48. Definition of Done

The project is NOT complete merely because files exist.

It is complete only when:

Frontend starts successfully.

Backend starts successfully.

Database initializes successfully.

User can register.

User can log in.

User can log out.

Protected routes work.

User can create a project.

User can upload an image.

Uploaded image is visible.

User can open the chatbot.

User can ask a question.

Backend routes the question.

Analysis executes.

Result is stored.

Result is displayed.

Chat history is stored.

Follow-up question retains context.

Language selection works.

Change detection works when two valid images are supplied.

Map works when geospatial metadata exists.

Errors are handled.

No secret keys are committed.

Demo mode works without external AI credentials.

49. Important Anti-Patterns

DO NOT:

Generate fake API responses.

Hard-code successful login.

Store passwords in plain text.

Put API keys in frontend code.

Pretend unsupported models are running.

Generate random confidence values.

Invent GPS coordinates.

Create dead UI buttons.

Create routes that return placeholder text.

Create hundreds of files without connecting them.

Leave TODOs in core MVP functionality.

Require every optional AI dependency for basic startup.

Make cloud services mandatory for local development.

Replace real functionality with screenshots.

50. Final AI Coding-Agent Instruction

You are responsible for implementing the entire repository.

Do NOT merely explain the architecture.

Do NOT return only code snippets.

Do NOT stop after creating the frontend.

Do NOT stop after creating the backend.

Do NOT create placeholder core functionality.

Build the project incrementally and ensure that each phase runs before proceeding.

When a requested advanced model is unavailable, implement a clean provider/model adapter and a transparent fallback rather than pretending the model exists.

The final repository must be runnable locally.

Before finishing:

Install dependencies.

Start backend.

Start frontend.

Verify /health.

Verify authentication.

Verify project creation.

Verify image upload.

Verify chat.

Verify query routing.

Verify analysis.

Verify result rendering.

Verify history.

Verify change detection.

Verify language switching.

Fix runtime errors.

Update README with exact commands.

Do not declare the project complete until the core user journey works end-to-end.

51. Final Core User Journey

The most important test is:

REGISTER
   ↓
LOGIN
   ↓
DASHBOARD
   ↓
CREATE PROJECT
   ↓
UPLOAD SATELLITE IMAGE
   ↓
OPEN CHAT
   ↓
ASK QUESTION
   ↓
AI QUERY ROUTER
   ↓
ANALYSIS
   ↓
EVIDENCE
   ↓
ANSWER
   ↓
FOLLOW-UP QUESTION
   ↓
CONTEXT RETAINED
   ↓
LANGUAGE SWITCH
   ↓
ANSWER IN SELECTED LANGUAGE
   ↓
UPLOAD SECOND IMAGE
   ↓
CHANGE DETECTION
   ↓
CHANGE MAP
   ↓
HISTORY

This end-to-end journey is more important than implementing every advanced feature immediately.

52. Final Acceptance Criteria

A reviewer should be able to understand the project in under five minutes.

They should see:

Satellite Image
        +
Natural Language
        +
AI Reasoning
        +
Remote Sensing Analysis
        +
Visual Evidence
        +
Geospatial Visualization
        +
Multilingual Interaction

The result should feel like a genuine AI-powered satellite intelligence assistant, not a generic chatbot attached to an image uploader.

Build for reliability first, then intelligence, then polish.