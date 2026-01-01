from __future__ import annotations

from pydantic import BaseModel, Field


class IssueCertificateRequest(BaseModel):
    student_wallet_address: str = Field(..., description="Recipient wallet address")
    student_name: str
    skill_name: str
    issuer_name: str
    issue_date: str  # ISO string


class IssueCertificateResponse(BaseModel):
    transaction_hash: str
    token_id: int
    ipfs_cid: str


class VerifyCertificateResponse(BaseModel):
    verification_status: bool
    student_name: str | None = None
    skill_name: str | None = None
    issuer_name: str | None = None
    issue_date: str | None = None
    wallet_address: str | None = None
