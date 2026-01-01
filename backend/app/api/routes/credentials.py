from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_organizer
from app.core.config import get_settings
from app.db import get_db
from app.models.credential import Credential
from app.schemas import CredentialRecord, IssueCredentialByEmailRequest, IssueCredentialByEmailResponse
from app.services.blockchain import BlockchainService
from app.services.ipfs import upload_metadata_json


router = APIRouter(prefix="/credentials", tags=["credentials"])


@router.post("/issue", response_model=IssueCredentialByEmailResponse)
async def issue_credential_by_email(
    payload: IssueCredentialByEmailRequest,
    organizer: dict = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.contract_address:
        raise HTTPException(status_code=500, detail="Contract address not configured")

    issuer_email = organizer.get("email") or organizer.get("user_id") or "unknown"

    metadata = {
        "student_wallet_address": payload.student_wallet_address,
        "student_name": payload.student_name,
        "skill_name": payload.skill_name,
        "issuer_name": payload.issuer_name,
        "issue_date": payload.issue_date,
        "student_email": str(payload.student_email),
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

    cred = Credential(
        student_email=str(payload.student_email),
        issued_by_email=str(issuer_email),
        issuer_name=str(payload.issuer_name) if payload.issuer_name else None,
        contract_address=settings.contract_address,
        token_id=int(token_id),
        transaction_hash=tx_hash,
        ipfs_cid=cid,
    )

    try:
        db.add(cred)
        db.commit()
        db.refresh(cred)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB write failed: {e}")

    return IssueCredentialByEmailResponse(credential=CredentialRecord.model_validate(cred))


@router.get("/me", response_model=list[CredentialRecord])
async def list_my_credentials(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email in auth token")

    rows = (
        db.query(Credential)
        .filter(Credential.student_email == email)
        .order_by(Credential.created_at.desc())
        .all()
    )

    return [CredentialRecord.model_validate(r) for r in rows]


@router.get("/issued", response_model=list[CredentialRecord])
async def list_issued_credentials(organizer: dict = Depends(require_organizer), db: Session = Depends(get_db)):
    email = organizer.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email in auth token")

    rows = (
        db.query(Credential)
        .filter(Credential.issued_by_email == email)
        .order_by(Credential.created_at.desc())
        .all()
    )

    return [CredentialRecord.model_validate(r) for r in rows]
