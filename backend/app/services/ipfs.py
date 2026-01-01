from __future__ import annotations

import os
import uuid
from typing import Any, Dict

import httpx

from app.core.config import get_settings


PIN_JSON_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
GATEWAY_BASE = "https://gateway.pinata.cloud/ipfs/"

_LOCAL_IPFS: Dict[str, Dict[str, Any]] = {}


async def upload_metadata_json(metadata: Dict[str, Any]) -> str:
    """Uploads metadata JSON to Pinata and returns the IPFS CID (hash)."""
    if os.getenv("LOCAL_BYPASS_IPFS", "").lower() in {"1", "true", "yes"}:
        cid = f"local-{uuid.uuid4().hex}"
        _LOCAL_IPFS[cid] = metadata
        return cid

    settings = get_settings()
    headers = {
        "pinata_api_key": settings.pinata_api_key or "",
        "pinata_secret_api_key": settings.pinata_secret_key or "",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(PIN_JSON_ENDPOINT, headers=headers, json={"pinataContent": metadata})
        resp.raise_for_status()
        data = resp.json()
        cid = data.get("IpfsHash")
        if not cid:
            raise RuntimeError("Failed to get IpfsHash from Pinata response")
        return cid


async def fetch_json_from_cid(cid: str) -> Dict[str, Any]:
    if os.getenv("LOCAL_BYPASS_IPFS", "").lower() in {"1", "true", "yes"}:
        if cid not in _LOCAL_IPFS:
            raise RuntimeError("CID not found in local IPFS store")
        return _LOCAL_IPFS[cid]

    url = f"{GATEWAY_BASE}{cid}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()
