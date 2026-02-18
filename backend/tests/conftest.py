import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DB_PATH = BACKEND_DIR / "test_xteam_pro.db"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
os.environ["OPENAI_API_KEY"] = "your-openai-api-key-here"
os.environ["DEFAULT_ADMIN_USERNAME"] = "admin"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "admin123"
os.environ["DEFAULT_ADMIN_EMAIL"] = "admin@xteam.pro"
os.environ["ENVIRONMENT"] = "development"

from main import app  # noqa: E402
from services.auth_service import AuthService  # noqa: E402
from services.email_service import EmailService  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()

    yield

    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture
def client(mock_email_service):
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()

    with TestClient(app) as test_client:
        yield test_client

    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture(autouse=True)
def mock_email_service(monkeypatch):
    async def _send_ok(*args, **kwargs):
        return True

    monkeypatch.setattr(EmailService, "send_email", _send_ok)
    monkeypatch.setattr(EmailService, "send_contact_notification", _send_ok)
    monkeypatch.setattr(EmailService, "send_contact_confirmation", _send_ok)

    monkeypatch.setattr(AuthService, "get_password_hash", lambda self, password: f"test-hash::{password}")
    monkeypatch.setattr(
        AuthService,
        "verify_password",
        lambda self, plain_password, hashed_password: hashed_password == f"test-hash::{plain_password}",
    )


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/api/admin/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
