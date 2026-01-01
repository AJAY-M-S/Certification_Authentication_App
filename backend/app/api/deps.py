from __future__ import annotations

import os
from fastapi import Depends, Header, HTTPException, status

from app.core.firebase import verify_firebase_token, has_organizer_role


async def get_current_user(
    authorization: str | None = Header(default=None),
    x_user_email: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
) -> dict:
    if os.getenv("LOCAL_BYPASS_AUTH", "").lower() in {"1", "true", "yes"}:
        # Local dev bypass: trust headers.
        return {
            "email": x_user_email or "student@example.com",
            "role": x_user_role or "student",
        }

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        decoded = verify_firebase_token(token)
        return decoded
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Firebase token: {e}")


async def require_organizer(user: dict = Depends(get_current_user)) -> dict:
    if os.getenv("LOCAL_BYPASS_AUTH", "").lower() in {"1", "true", "yes"}:
        # In local dev bypass mode, allow issuing.
        return user

    if not has_organizer_role(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organizer role required")
    return user
