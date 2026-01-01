from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.api.deps import require_organizer
from app.models.certificate import IssueCertificateRequest, IssueCertificateResponse
from app.services.ipfs import upload_metadata_json
from app.services.blockchain import BlockchainService


router = APIRouter()


@router.post("/issue-certificate", response_model=IssueCertificateResponse)
async def issue_certificate(payload: IssueCertificateRequest, _: dict = Depends(require_organizer)):
    metadata = {
        "student_wallet_address": payload.student_wallet_address,
        "student_name": payload.student_name,
        "skill_name": payload.skill_name,
        "issuer_name": payload.issuer_name,
        "issue_date": payload.issue_date,
    }

    try:
        cid = await upload_metadata_json(metadata)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IPFS upload failed: {e}")

    token_uri = f"ipfs://{cid}"

    try:
        bc = BlockchainService()
        tx_hash, token_id = await run_in_threadpool(bc.mint_certificate, payload.student_wallet_address, token_uri)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain mint failed: {e}")

    return IssueCertificateResponse(transaction_hash=tx_hash, token_id=token_id, ipfs_cid=cid)
