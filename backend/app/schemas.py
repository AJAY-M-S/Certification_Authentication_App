from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class IssueCredentialByEmailRequest(BaseModel):
    student_email: EmailStr
    student_wallet_address: str = Field(..., description="Recipient wallet address")

    # Used only to generate the IPFS metadata (not stored in DB)
    student_name: str
    skill_name: str
    issuer_name: str
    issue_date: str  # ISO string


class CredentialRecord(BaseModel):
    id: int
    student_email: EmailStr
    issued_by_email: EmailStr

    contract_address: str
    token_id: int
    transaction_hash: str
    ipfs_cid: str
    created_at: datetime

    class Config:
        from_attributes = True


class IssueCredentialByEmailResponse(BaseModel):
    credential: CredentialRecord


class UpsertIssuerProfileRequest(BaseModel):
    issuer_name: str
    issuer_wallet_address: str


class IssuerProfileRecord(BaseModel):
    id: int
    organizer_email: EmailStr
    issuer_name: str
    issuer_wallet_address: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IssuerProfileResponse(BaseModel):
    profile: IssuerProfileRecord
