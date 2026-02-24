from fastapi import Request, status
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware
    For production, consider using Redis for distributed rate limiting
    """
    
    def __init__(
        self,
        app: ASGIApp,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.minute_requests: Dict[str, List[datetime]] = defaultdict(list)
        self.hour_requests: Dict[str, List[datetime]] = defaultdict(list)
        
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        return request.client.host if request.client else "unknown"
    
    def _clean_old_requests(self, client_ip: str):
        """Remove old requests from tracking"""
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)
        
        # Clean minute requests
        self.minute_requests[client_ip] = [
            req_time for req_time in self.minute_requests[client_ip]
            if req_time > minute_ago
        ]
        
        # Clean hour requests
        self.hour_requests[client_ip] = [
            req_time for req_time in self.hour_requests[client_ip]
            if req_time > hour_ago
        ]
    
    def _is_rate_limited(self, client_ip: str) -> Tuple[bool, str]:
        """Check if client is rate limited"""
        self._clean_old_requests(client_ip)
        
        minute_count = len(self.minute_requests[client_ip])
        hour_count = len(self.hour_requests[client_ip])
        
        if minute_count >= self.requests_per_minute:
            return True, f"Rate limit exceeded: {minute_count} requests in the last minute. Limit: {self.requests_per_minute}/minute"
        
        if hour_count >= self.requests_per_hour:
            return True, f"Rate limit exceeded: {hour_count} requests in the last hour. Limit: {self.requests_per_hour}/hour"
        
        return False, ""
    
    def _record_request(self, client_ip: str):
        """Record a new request"""
        now = datetime.utcnow()
        self.minute_requests[client_ip].append(now)
        self.hour_requests[client_ip].append(now)
    
    async def dispatch(self, request: Request, call_next):
        """Rate limiting middleware"""
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Skip rate limiting for static files
        if request.url.path.startswith("/static/"):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        
        # Check rate limit
        is_limited, message = self._is_rate_limited(client_ip)
        
        if is_limited:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": message,
                    "retry_after": 60  # seconds
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit-Minute": str(self.requests_per_minute),
                    "X-RateLimit-Limit-Hour": str(self.requests_per_hour),
                    "X-RateLimit-Remaining-Minute": str(max(0, self.requests_per_minute - len(self.minute_requests[client_ip]))),
                    "X-RateLimit-Remaining-Hour": str(max(0, self.requests_per_hour - len(self.hour_requests[client_ip])))
                }
            )
        
        # Record the request
        self._record_request(client_ip)
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)
        response.headers["X-RateLimit-Remaining-Minute"] = str(max(0, self.requests_per_minute - len(self.minute_requests[client_ip])))
        response.headers["X-RateLimit-Remaining-Hour"] = str(max(0, self.requests_per_hour - len(self.hour_requests[client_ip])))
        
        return response
