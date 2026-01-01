from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional, Tuple

from web3 import Web3
try:
    # Web3.py v6 preferred POA middleware
    from web3.middleware import ExtraDataToPOAMiddleware as _POA_MW  # type: ignore
except Exception:  # pragma: no cover - fallback for older versions
    from web3.middleware import geth_poa_middleware as _POA_MW  # type: ignore
from web3.types import TxParams

from app.core.config import get_settings


class BlockchainService:
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.polygon_rpc_url:
            raise RuntimeError("POLYGON_RPC_URL not configured")
        if not self.settings.private_key:
            raise RuntimeError("PRIVATE_KEY not configured")
        self.web3 = Web3(Web3.HTTPProvider(self.settings.polygon_rpc_url))
        # For Polygon testnets, POA middleware often required
        self.web3.middleware_onion.inject(_POA_MW, layer=0)
        self.account = self.web3.eth.account.from_key(self.settings.private_key)
        self.chain_id = self.web3.eth.chain_id
        self.contract = self._load_contract()

    def _load_contract(self):
        if not self.settings.contract_address:
            raise RuntimeError("CONTRACT_ADDRESS not configured (env or shared/addresses/contract.json)")
        abi: Any
        if not os.path.exists(self.settings.abi_path):
            raise RuntimeError(f"ABI file not found at {self.settings.abi_path}")
        with open(self.settings.abi_path, "r", encoding="utf-8") as f:
            abi_json = json.load(f)
        if isinstance(abi_json, dict) and "abi" in abi_json:
            abi = abi_json["abi"]
        elif isinstance(abi_json, list):
            abi = abi_json
        else:
            raise RuntimeError("Invalid ABI file format. Provide list or object with 'abi' key.")
        return self.web3.eth.contract(address=Web3.to_checksum_address(self.settings.contract_address), abi=abi)

    def _select_mint_fn(self):
        candidates = [
            ("mintCredential", ["address", "string"]),
            ("mintWithTokenURI", ["address", "string"]),
            ("safeMint", ["address", "string"]),
            ("mint", ["address", "string"]),
        ]
        for name, _ in candidates:
            try:
                fn = getattr(self.contract.functions, name)
                # Accessing attribute shouldn't throw; we rely on call/build to validate
                return name, fn
            except Exception:
                continue
        raise RuntimeError("No supported mint function found. Expected one of: mintCredential, mintWithTokenURI, safeMint, mint")

    def mint_certificate(self, to_address: str, token_uri: str) -> Tuple[str, int]:
        name, fn_factory = self._select_mint_fn()
        # Build tx
        nonce = self.web3.eth.get_transaction_count(self.account.address)
        tx: TxParams
        try:
            tx = fn_factory(to_address, token_uri).build_transaction({
                "from": self.account.address,
                "nonce": nonce,
                "chainId": self.chain_id,
                "gasPrice": self.web3.eth.gas_price,
            })
        except TypeError:
            # Some contracts may accept only tokenURI and infer msg.sender; try alternative signatures
            try:
                tx = fn_factory(token_uri).build_transaction({
                    "from": self.account.address,
                    "nonce": nonce,
                    "chainId": self.chain_id,
                    "gasPrice": self.web3.eth.gas_price,
                })
            except Exception as e:
                raise RuntimeError(f"Unable to build mint transaction: {e}")

        # Estimate gas safely
        try:
            gas_estimate = self.web3.eth.estimate_gas(tx)
            tx["gas"] = int(gas_estimate * 1.2)
        except Exception:
            # fallback gas limit
            tx["gas"] = 500_000

        signed = self.account.sign_transaction(tx)
        raw_tx = getattr(signed, "rawTransaction", None)
        if raw_tx is None:
            raw_tx = getattr(signed, "raw_transaction", None)
        if raw_tx is None:
            raise RuntimeError("Unable to access signed raw transaction bytes")

        tx_hash = self.web3.eth.send_raw_transaction(raw_tx)
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        # Try to infer tokenId from events if available; else query latest token by owner is contract-specific.
        token_id: Optional[int] = None
        try:
            # Common ERC721 Transfer event: topics[0] = Transfer signature
            transfer_events = self.contract.events.Transfer().process_receipt(receipt)
            for ev in transfer_events:
                if ev["args"].get("to", "").lower() == to_address.lower():
                    token_id = int(ev["args"]["tokenId"])  # type: ignore
                    break
        except Exception:
            token_id = None
        if token_id is None:
            token_id = -1
        return tx_hash.hex(), token_id

    def get_token_uri(self, token_id: int) -> str:
        return self.contract.functions.tokenURI(token_id).call()

    def get_owner_of(self, token_id: int) -> str:
        return self.contract.functions.ownerOf(token_id).call()
