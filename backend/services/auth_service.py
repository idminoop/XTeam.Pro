import os
import logging
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from database.config import get_async_db
from models.admin import AdminUser

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
        if not self.secret_key:
            raise RuntimeError(
                "JWT_SECRET_KEY or SECRET_KEY environment variable is required and must not be empty"
            )
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against its hash
        """
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """
        Hash a password
        """
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token
        """
        to_encode = data.copy()
        if "sub" in to_encode:
            to_encode["sub"] = str(to_encode["sub"])
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT refresh token
        """
        to_encode = data.copy()
        if "sub" in to_encode:
            to_encode["sub"] = str(to_encode["sub"])
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode JWT token
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            return payload
            
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    async def authenticate_user(self, username: str, password: str) -> Optional[AdminUser]:
        """
        Authenticate user with username and password
        """
        async for db in get_async_db():
            try:
                # Get user by username or email
                query = select(AdminUser).where(
                    (AdminUser.username == username) | (AdminUser.email == username)
                )
                result = await db.execute(query)
                user = result.scalar_one_or_none()
                
                if not user:
                    return None
                
                if not user.is_active:
                    return None
                
                if not self.verify_password(password, user.hashed_password):
                    return None
                
                # Update last login
                user.last_login = datetime.utcnow()
                await db.commit()
                
                return user
                
            except Exception as e:
                logger.error(f"Error authenticating user: {str(e)}")
                return None
            finally:
                await db.close()
    
    async def get_user_by_id(self, user_id: str) -> Optional[AdminUser]:
        """
        Get user by ID
        """
        async for db in get_async_db():
            try:
                user_db_id = int(user_id)
                return await db.get(AdminUser, user_db_id)
            except Exception as e:
                logger.error(f"Error getting user by ID: {str(e)}")
                return None
            finally:
                await db.close()
    
    async def get_user_by_username(self, username: str) -> Optional[AdminUser]:
        """
        Get user by username
        """
        async for db in get_async_db():
            try:
                query = select(AdminUser).where(AdminUser.username == username)
                result = await db.execute(query)
                return result.scalar_one_or_none()
            except Exception as e:
                logger.error(f"Error getting user by username: {str(e)}")
                return None
            finally:
                await db.close()
    
    async def create_user(
        self, 
        username: str, 
        email: str, 
        password: str, 
        full_name: str,
        role: str = "admin"
    ) -> AdminUser:
        """
        Create new admin user
        """
        async for db in get_async_db():
            try:
                # Check if user already exists
                existing_query = select(AdminUser).where(
                    (AdminUser.username == username) | (AdminUser.email == email)
                )
                existing_result = await db.execute(existing_query)
                existing_user = existing_result.scalar_one_or_none()
                
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User with this username or email already exists"
                    )
                
                # Create new user
                hashed_password = self.get_password_hash(password)
                
                new_user = AdminUser(
                    username=username,
                    email=email,
                    first_name=full_name.split(' ')[0] if full_name else 'Admin',
                    last_name=' '.join(full_name.split(' ')[1:]) if full_name and len(full_name.split(' ')) > 1 else 'User',
                    hashed_password=hashed_password,
                    role=role,
                    is_active=True
                )
                
                db.add(new_user)
                await db.commit()
                await db.refresh(new_user)
                
                return new_user
                
            except HTTPException:
                raise
            except Exception as e:
                await db.rollback()
                logger.error(f"Error creating user: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error creating user"
                )
            finally:
                await db.close()
    
    async def update_user_password(self, user_id: str, new_password: str) -> bool:
        """
        Update user password
        """
        async for db in get_async_db():
            try:
                user = await db.get(AdminUser, user_id)
                if not user:
                    return False
                
                user.hashed_password = self.get_password_hash(new_password)
                await db.commit()
                
                return True
                
            except Exception as e:
                await db.rollback()
                logger.error(f"Error updating password: {str(e)}")
                return False
            finally:
                await db.close()
    
    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate user account
        """
        async for db in get_async_db():
            try:
                user = await db.get(AdminUser, user_id)
                if not user:
                    return False
                
                user.is_active = False
                await db.commit()
                
                return True
                
            except Exception as e:
                await db.rollback()
                logger.error(f"Error deactivating user: {str(e)}")
                return False
            finally:
                await db.close()
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """
        Generate new access token using refresh token
        """
        try:
            # Verify refresh token
            payload = self.verify_token(refresh_token, "refresh")
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Get user
            user = await self.get_user_by_id(user_id)
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
            
            # Create new access token
            access_token = self.create_access_token(
                data={"sub": user.id, "username": user.username, "role": user.role}
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )
    
    def create_login_response(self, user: AdminUser) -> Dict[str, Any]:
        """
        Create login response with tokens and user info
        """
        # Create tokens
        access_token = self.create_access_token(
            data={"sub": user.id, "username": user.username, "role": user.role}
        )
        refresh_token = self.create_refresh_token(
            data={"sub": user.id, "username": user.username}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": f"{user.first_name} {user.last_name}",
                "role": user.role,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
        }
    
    async def initialize_default_admin(self):
        """
        Ensure a bootstrap super_admin account exists.
        """
        try:
            async for db in get_async_db():
                # If any super admin already exists, nothing to do.
                super_admin_q = select(AdminUser).where(AdminUser.role == "super_admin")
                existing_super_admin = (await db.execute(super_admin_q)).scalar_one_or_none()
                if existing_super_admin:
                    await db.close()
                    return

                default_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
                default_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
                default_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@xteam.pro")

                # Reuse existing default account if it exists, elevate to super_admin.
                existing_default_q = select(AdminUser).where(
                    (AdminUser.username == default_username) | (AdminUser.email == default_email)
                )
                existing_default = (await db.execute(existing_default_q)).scalar_one_or_none()

                if existing_default:
                    existing_default.role = "super_admin"
                    existing_default.is_active = True
                    existing_default.is_verified = True
                    existing_default.can_manage_audits = True
                    existing_default.can_manage_users = True
                    existing_default.can_view_analytics = True
                    existing_default.can_export_data = True
                    existing_default.can_manage_content = True
                    existing_default.can_read_audits = True
                    existing_default.can_write_audits = True
                    existing_default.can_delete_audits = True
                    existing_default.can_read_contacts = True
                    existing_default.can_write_contacts = True
                    existing_default.can_delete_contacts = True
                    existing_default.can_publish_content = True
                    existing_default.can_manage_cases = True
                    existing_default.skip_email_verification = True
                    await db.commit()
                    logger.info("Existing default account promoted to super_admin: %s", default_username)
                    await db.close()
                    return

                # Create brand-new super_admin.
                new_user = AdminUser(
                    username=default_username,
                    email=default_email,
                    first_name="System",
                    last_name="Administrator",
                    hashed_password=self.get_password_hash(default_password),
                    role="super_admin",
                    is_active=True,
                    is_verified=True,
                    can_manage_audits=True,
                    can_manage_users=True,
                    can_view_analytics=True,
                    can_export_data=True,
                    can_manage_content=True,
                    can_read_audits=True,
                    can_write_audits=True,
                    can_delete_audits=True,
                    can_read_contacts=True,
                    can_write_contacts=True,
                    can_delete_contacts=True,
                    can_publish_content=True,
                    can_manage_cases=True,
                    skip_email_verification=True,
                )
                db.add(new_user)
                await db.commit()
                logger.info("Bootstrap super_admin created: %s", default_username)
                await db.close()
                
        except Exception as e:
            logger.error(f"Error initializing default admin: {str(e)}")
