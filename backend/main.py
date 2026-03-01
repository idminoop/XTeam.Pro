from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import asyncio
import logging
from datetime import datetime

# Import database
from database.config import async_engine, get_async_db, init_db, run_migrations_to_head

# Import routes
from routes.audit import router as audit_router
from routes.contact import router as contact_router
from routes.calculator import router as calculator_router
from routes.admin import router as admin_router
from routes.blog import router as blog_router
from routes.cases import router as cases_router
from routes.admin_cases import router as admin_cases_router
from routes.admin_backups import router as admin_backups_router

# Import services
from services.auth_service import AuthService

# Import middleware
from middleware.rate_limit import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting XTeam.Pro FastAPI application...")
    
    try:
        # Apply all pending migrations before touching ORM models.
        await asyncio.to_thread(run_migrations_to_head)
        logger.info("Database migrations applied successfully")

        # Initialize database
        await init_db()
        logger.info("Database initialized successfully")
        
        # Initialize default admin user
        auth_service = AuthService()
        await auth_service.initialize_default_admin()
        logger.info("Default admin user initialized")
        
        # Ensure required directories exist
        os.makedirs("reports", exist_ok=True)
        os.makedirs("uploads", exist_ok=True)
        os.makedirs("email_templates", exist_ok=True)
        logger.info("Required directories created")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down XTeam.Pro FastAPI application...")
    try:
        await async_engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Create FastAPI application
app = FastAPI(
    title="XTeam.Pro API",
    description="Business Automation Assessment and Consulting Platform API",
    version="1.0.0",
    debug=DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None
)

# Add trusted host middleware
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add rate limiting middleware (only in production)
if ENVIRONMENT == "production":
    rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_window = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))
    app.add_middleware(RateLimitMiddleware, requests_per_minute=60, requests_per_hour=rate_limit_requests)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.utcnow()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    # Log request details
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s - "
        f"Client: {request.client.host if request.client else 'unknown'}"
    )
    
    # Add processing time to response headers
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    if DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc),
                "path": str(request.url.path),
                "method": request.method
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred. Please try again later."
            }
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to XTeam.Pro API",
        "version": "1.0.0",
        "docs": "/docs" if DEBUG else "Documentation not available in production",
        "health": "/health"
    }

# API Info endpoint
@app.get("/api/info")
async def api_info():
    """API information endpoint"""
    return {
        "name": "XTeam.Pro API",
        "version": "1.0.0",
        "description": "Business Automation Assessment and Consulting Platform",
        "environment": ENVIRONMENT,
        "debug": DEBUG,
        "endpoints": {
            "audit": "/api/audit",
            "contact": "/api/contact",
            "calculator": "/api/calculator",
            "admin": "/api/admin",
            "blog": "/api/blog",
            "cases": "/api/cases",
        }
    }

# Include routers
app.include_router(
    audit_router,
    prefix="/api/audit",
    tags=["Audit"]
)

app.include_router(
    contact_router,
    prefix="/api/contact",
    tags=["Contact"]
)

app.include_router(
    calculator_router,
    prefix="/api/calculator",
    tags=["Calculator"]
)

app.include_router(
    admin_router,
    prefix="/api/admin",
    tags=["Admin"]
)

app.include_router(
    blog_router,
    prefix="/api/blog",
    tags=["Blog"]
)

app.include_router(
    cases_router,
    prefix="/api/cases",
    tags=["Cases"]
)

app.include_router(
    admin_cases_router,
    prefix="/api/admin",
    tags=["Admin Cases"]
)

app.include_router(
    admin_backups_router,
    prefix="/api/admin",
    tags=["Admin Backups"]
)

# Mount static files (for serving PDF reports and uploads)
if os.path.exists("reports"):
    app.mount("/reports", StaticFiles(directory="reports"), name="reports")

if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Development-only endpoints
if DEBUG:
    @app.get("/api/debug/routes")
    async def debug_routes():
        """List all available routes (debug only)"""
        routes = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                routes.append({
                    "path": route.path,
                    "methods": list(route.methods),
                    "name": getattr(route, 'name', 'unnamed')
                })
        return {"routes": routes}
    

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=DEBUG,
        log_level="info" if not DEBUG else "debug",
        access_log=True
    )
