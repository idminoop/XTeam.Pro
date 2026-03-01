"""
Bootstrap utility for local environments.

Usage:
    python backend/bootstrap_super_admin.py
"""

import asyncio
import os

from database.config import run_migrations_to_head
from services.auth_service import AuthService


async def _run() -> None:
    run_migrations_to_head()
    auth = AuthService()
    await auth.initialize_default_admin()

    username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
    email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@xteam.pro")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    print("super_admin is ready")
    print(f"username: {username}")
    print(f"email: {email}")
    print(f"password: {password}")


if __name__ == "__main__":
    asyncio.run(_run())
