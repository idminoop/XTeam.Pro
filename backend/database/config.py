from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Database URL
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_URL = f"sqlite:///{(BACKEND_DIR / 'xteam_pro.db').as_posix()}"
RAW_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

if RAW_DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = RAW_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    ASYNC_DATABASE_URL = RAW_DATABASE_URL
elif RAW_DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = RAW_DATABASE_URL
    ASYNC_DATABASE_URL = RAW_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
elif RAW_DATABASE_URL.startswith("sqlite+aiosqlite:///"):
    DATABASE_URL = RAW_DATABASE_URL.replace("sqlite+aiosqlite:///", "sqlite:///")
    ASYNC_DATABASE_URL = RAW_DATABASE_URL
elif RAW_DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = RAW_DATABASE_URL
    ASYNC_DATABASE_URL = RAW_DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    DATABASE_URL = RAW_DATABASE_URL
    ASYNC_DATABASE_URL = RAW_DATABASE_URL

# Create engines
engine = create_engine(DATABASE_URL)
async_engine = create_async_engine(ASYNC_DATABASE_URL)

# Create session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# Create base class for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Async dependency to get database session
async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session


# Initialize database
async def init_db():
    async with async_engine.begin() as conn:
        # Import all models to ensure they are registered
        from models import audit, contact, admin, blog, media, case_study
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


def _is_sqlite_url() -> bool:
    return RAW_DATABASE_URL.startswith(("sqlite:///", "sqlite+aiosqlite:///"))


def _sqlite_table_names(conn) -> set[str]:
    return {
        row[0]
        for row in conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table'")
        )
    }


def _sqlite_table_columns(conn, table_name: str) -> set[str]:
    return {
        row[1]
        for row in conn.execute(text(f"PRAGMA table_info({table_name})"))
    }


def _sqlite_add_column_if_missing(
    conn,
    table_name: str,
    existing_columns: set[str],
    column_name: str,
    definition_sql: str,
) -> bool:
    if column_name in existing_columns:
        return False
    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {definition_sql}"))
    existing_columns.add(column_name)
    return True


def _repair_legacy_sqlite_schema() -> None:
    """
    Repair legacy SQLite schemas that were created before Alembic adoption.
    This is idempotent and only adds missing columns required by current models.
    """
    if not _is_sqlite_url():
        return

    with engine.begin() as conn:
        tables = _sqlite_table_names(conn)

        if "admin_users" in tables:
            admin_columns = _sqlite_table_columns(conn, "admin_users")
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_read_audits",
                "can_read_audits BOOLEAN NOT NULL DEFAULT 1",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_write_audits",
                "can_write_audits BOOLEAN NOT NULL DEFAULT 1",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_delete_audits",
                "can_delete_audits BOOLEAN NOT NULL DEFAULT 0",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_read_contacts",
                "can_read_contacts BOOLEAN NOT NULL DEFAULT 1",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_write_contacts",
                "can_write_contacts BOOLEAN NOT NULL DEFAULT 1",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_delete_contacts",
                "can_delete_contacts BOOLEAN NOT NULL DEFAULT 0",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_publish_content",
                "can_publish_content BOOLEAN NOT NULL DEFAULT 0",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "can_manage_cases",
                "can_manage_cases BOOLEAN NOT NULL DEFAULT 0",
            )
            _sqlite_add_column_if_missing(
                conn,
                "admin_users",
                admin_columns,
                "skip_email_verification",
                "skip_email_verification BOOLEAN NOT NULL DEFAULT 0",
            )

            if {"can_manage_audits", "can_manage_content"}.issubset(admin_columns):
                conn.execute(
                    text(
                        """
                        UPDATE admin_users
                        SET
                            can_read_audits = COALESCE(can_manage_audits, 0),
                            can_write_audits = COALESCE(can_manage_audits, 0),
                            can_delete_audits = COALESCE(can_delete_audits, 0),
                            can_read_contacts = COALESCE(can_manage_audits, 0),
                            can_write_contacts = COALESCE(can_manage_audits, 0),
                            can_delete_contacts = COALESCE(can_delete_contacts, 0),
                            can_publish_content = COALESCE(can_manage_content, 0),
                            can_manage_cases = COALESCE(can_manage_content, 0),
                            skip_email_verification = COALESCE(skip_email_verification, 0)
                        """
                    )
                )

        if "contact_inquiries" in tables:
            inquiry_columns = _sqlite_table_columns(conn, "contact_inquiries")
            _sqlite_add_column_if_missing(
                conn,
                "contact_inquiries",
                inquiry_columns,
                "tags",
                "tags VARCHAR(500)",
            )
            _sqlite_add_column_if_missing(
                conn,
                "contact_inquiries",
                inquiry_columns,
                "score",
                "score INTEGER NOT NULL DEFAULT 0",
            )
            _sqlite_add_column_if_missing(
                conn,
                "contact_inquiries",
                inquiry_columns,
                "pipeline_stage",
                "pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'new'",
            )

            if {"status", "pipeline_stage"}.issubset(inquiry_columns):
                conn.execute(
                    text(
                        """
                        UPDATE contact_inquiries
                        SET pipeline_stage = CASE
                            WHEN status IN ('new', 'contacted', 'qualified', 'converted', 'closed') THEN status
                            ELSE 'new'
                        END
                        """
                    )
                )

        if "blog_posts" in tables:
            blog_columns = _sqlite_table_columns(conn, "blog_posts")
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "title_ru",
                "title_ru VARCHAR(255)",
            )
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "title_en",
                "title_en VARCHAR(255)",
            )
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "excerpt_ru",
                "excerpt_ru TEXT",
            )
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "excerpt_en",
                "excerpt_en TEXT",
            )
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "content_ru",
                "content_ru TEXT",
            )
            _sqlite_add_column_if_missing(
                conn,
                "blog_posts",
                blog_columns,
                "content_en",
                "content_en TEXT",
            )


def run_migrations_to_head() -> None:
    """
    Apply Alembic migrations up to HEAD.
    Uses a subprocess to avoid nested event-loop issues inside FastAPI startup.
    """
    run_script = BACKEND_DIR / "run_alembic.py"
    if not run_script.exists():
        raise RuntimeError(f"Alembic runner not found: {run_script}")

    env = os.environ.copy()
    env.setdefault("DATABASE_URL", RAW_DATABASE_URL)

    def run_alembic(*args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(run_script), *args],
            cwd=str(BACKEND_DIR),
            env=env,
            capture_output=True,
            text=True,
        )

    def extract_details(result: subprocess.CompletedProcess[str]) -> str:
        stderr = (result.stderr or "").strip()
        stdout = (result.stdout or "").strip()
        return stderr or stdout or "Unknown Alembic error"

    # SQLite development path:
    # this project historically relied on SQLAlchemy create_all(), and some
    # Alembic migrations assume tables that may not exist on a fresh DB.
    if _is_sqlite_url():
        from models import audit, contact, admin, blog, media, case_study  # noqa: F401

        Base.metadata.create_all(bind=engine)
        _repair_legacy_sqlite_schema()

        stamp_result = run_alembic("stamp", "head")
        if stamp_result.returncode != 0:
            raise RuntimeError(
                f"Failed to stamp SQLite schema to head: {extract_details(stamp_result)}"
            )
        return

    result = run_alembic("upgrade", "head")
    if result.returncode != 0:
        raise RuntimeError(f"Failed to apply migrations: {extract_details(result)}")
