from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL
RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./xteam_pro.db")

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
        from models import audit, contact, admin, blog
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
