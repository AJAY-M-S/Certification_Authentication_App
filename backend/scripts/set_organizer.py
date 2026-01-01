from __future__ import annotations

import os
import pathlib
import sys

from firebase_admin import auth

# Allow running as: python scripts/set_organizer.py ...
BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("PYTHONPATH", str(BACKEND_ROOT))

from app.core.firebase import init_firebase


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.set_organizer <conductor_email>")
        return 2

    email = sys.argv[1].strip()
    if not email:
        print("Email is required")
        return 2

    init_firebase()

    user = auth.get_user_by_email(email)
    auth.set_custom_user_claims(user.uid, {"role": "organizer"})
    print(f"Set role=organizer for {email} (uid={user.uid}).")
    print("User must sign out and sign in again to refresh token claims.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
