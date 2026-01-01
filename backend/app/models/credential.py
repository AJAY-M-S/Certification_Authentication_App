from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    student_email: Mapped[str] = mapped_column(String(320), index=True, nullable=False)
    issued_by_email: Mapped[str] = mapped_column(String(320), index=True, nullable=False)

    contract_address: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    token_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    transaction_hash: Mapped[str] = mapped_column(String(80), nullable=False)
    ipfs_cid: Mapped[str] = mapped_column(String(128), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("contract_address", "token_id", name="uq_credentials_contract_token"),
    )
