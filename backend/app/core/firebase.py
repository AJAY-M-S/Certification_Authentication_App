from __future__ import annotations

import json
from typing import Any, Dict, Optional

import firebase_admin
from firebase_admin import auth, credentials

from .config import get_settings


_app_initialized = False


def init_firebase() -> None:
    global _app_initialized
    if _app_initialized:
        return
    settings = get_settings()
    cred: credentials.Base
    if settings.firebase_service_account_json:
        try:
            service_account_info = json.loads(settings.firebase_service_account_json)
        except Exception as e:
            raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: {e}")
        cred = credentials.Certificate(service_account_info)
    else:
        if not settings.firebase_credentials_path:
            raise RuntimeError("FIREBASE_CREDENTIALS_PATH not set")
        cred = credentials.Certificate(settings.firebase_credentials_path)
    firebase_admin.initialize_app(cred, {
        'projectId': settings.firebase_project_id,
    })
    _app_initialized = True


def verify_firebase_token(id_token: str) -> Dict[str, Any]:
    if not _app_initialized:
        init_firebase()
    decoded = auth.verify_id_token(id_token, check_revoked=True)
    return decoded


def has_organizer_role(decoded_token: Dict[str, Any]) -> bool:
    # Custom claims should include 'role': 'organizer'
    role: Optional[str] = decoded_token.get('role') or decoded_token.get('claims', {}).get('role')
    return role == 'organizer'
