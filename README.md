# Skill Credentials (GDG Hackathon)

Monorepo:
- `backend/` FastAPI API (Firebase Auth + Polygon + IPFS + Postgres)
- `frontend/` React + Vite UI
- `contracts/` Solidity/Hardhat

## Backend (FastAPI)

### Local run
1. Create `backend/.env` (copy from `backend/.env.example`).
2. Install deps:
   - `pip install -r backend/requirements.txt`
3. Run:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Render deployment
This repo includes `render.yaml` configured to deploy the backend from `backend/`.

On Render, set these environment variables (see `backend/.env.example`):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CREDENTIALS_PATH` (or mount the JSON via Render secret file)
- `PINATA_API_KEY`
- `PINATA_SECRET_KEY`
- `POLYGON_RPC_URL`
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS`
- `DATABASE_URL`
- `CORS_ALLOW_ORIGINS` (comma-separated frontend origins)

The backend exposes:
- `GET /health`

## Frontend (React + Vite)

### Local run
1. Create `frontend/.env` (copy from `frontend/.env.example`).
2. Install deps:
   - `npm install`
3. Run:
   - `npm run dev`

Set `VITE_BACKEND_BASE_URL` to your backend URL (Render service URL for production).

## Security
- Do not commit `.env` files or Firebase service account JSON.
- Rotate any keys that were previously committed.
