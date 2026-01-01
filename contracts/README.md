# Skill Credentials - Smart Contracts

## Setup
1. Copy `.env.example` to `.env` and fill:
   - `RPC_URL`
   - `PRIVATE_KEY`

2. Install dependencies:
   - `npm install`

## Deploy
- Polygon Amoy:
  - `npm run deploy:amoy`

This deploy script also writes:
- `backend/shared/addresses/contract.json`
- `backend/shared/abis/SkillCredential.json`

so the FastAPI backend can mint/verify.
