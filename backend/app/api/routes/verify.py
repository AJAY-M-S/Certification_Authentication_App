from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.models.certificate import VerifyCertificateResponse
from app.services.blockchain import BlockchainService
from app.services.ipfs import fetch_json_from_cid


router = APIRouter()


@router.get("/verify/{token_id}", response_model=VerifyCertificateResponse)
async def verify_certificate(token_id: int):
    bc = BlockchainService()
    try:
        token_uri = await run_in_threadpool(bc.get_token_uri, token_id)
        owner = await run_in_threadpool(bc.get_owner_of, token_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"On-chain query failed: {e}")

    cid = token_uri.replace("ipfs://", "")
    try:
        metadata = await fetch_json_from_cid(cid)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch IPFS metadata: {e}")

    return VerifyCertificateResponse(
        verification_status=True,
        student_name=metadata.get("student_name"),
        skill_name=metadata.get("skill_name"),
        issuer_name=metadata.get("issuer_name"),
        issue_date=metadata.get("issue_date"),
        wallet_address=owner,
    )
