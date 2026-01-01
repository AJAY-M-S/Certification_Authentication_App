from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv


load_dotenv()


@dataclass
class Settings:
    firebase_project_id: Optional[str]
    firebase_credentials_path: Optional[str]

    pinata_api_key: Optional[str]
    pinata_secret_key: Optional[str]

    polygon_rpc_url: str
    private_key: str

    contract_address: Optional[str]
    abi_path: str
    contract_address_path: str

    cors_allow_origins: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
    firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    pinata_api_key = os.getenv("PINATA_API_KEY")
    pinata_secret_key = os.getenv("PINATA_SECRET_KEY")

    polygon_rpc_url = os.getenv("POLYGON_RPC_URL", "")
    private_key = os.getenv("PRIVATE_KEY", "")

    contract_address = os.getenv("CONTRACT_ADDRESS")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    abi_path = os.path.join(base_dir, "shared", "abis", "SkillCredential.json")
    contract_address_path = os.path.join(base_dir, "shared", "addresses", "contract.json")

    cors_allow_origins = os.getenv("CORS_ALLOW_ORIGINS", "*")

    # If contract address not provided via env, try reading from file
    if not contract_address and os.path.exists(contract_address_path):
        try:
            with open(contract_address_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                contract_address = data.get("address")
        except Exception:
            contract_address = None

    return Settings(
        firebase_project_id=firebase_project_id,
        firebase_credentials_path=firebase_credentials_path,
        pinata_api_key=pinata_api_key,
        pinata_secret_key=pinata_secret_key,
        polygon_rpc_url=polygon_rpc_url,
        private_key=private_key,
        contract_address=contract_address,
        abi_path=abi_path,
        contract_address_path=contract_address_path,
        cors_allow_origins=cors_allow_origins,
    )
