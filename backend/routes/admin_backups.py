from typing import Any, Dict, List, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database.config import get_async_db
from models.admin import AdminUser
from routes.admin import get_current_admin_user
from services.backup_service import BackupService

router = APIRouter(tags=["admin-backups"])


class BackupCreateBody(BaseModel):
    mode: Literal["db_media", "db", "media"] = Field("db_media")


def _ensure_super_admin(user: AdminUser) -> None:
    if user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")


@router.get("/backups")
async def list_backups(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    _ensure_super_admin(current_user)
    service = BackupService()
    items = service.list_backups()
    return {"items": items}


@router.post("/backups", status_code=201)
async def create_backup(
    body: BackupCreateBody,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    _ensure_super_admin(current_user)
    service = BackupService()
    creator = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.username
    try:
        record = service.create_backup(body.mode, created_by=creator)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {exc}") from exc
    return record


@router.get("/backups/{backup_name}/download")
async def download_backup(
    backup_name: str,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    _ensure_super_admin(current_user)
    service = BackupService()
    try:
        path = service.get_backup_path(backup_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(path=str(path), filename=path.name, media_type="application/zip")


@router.delete("/backups/{backup_name}")
async def delete_backup(
    backup_name: str,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    _ensure_super_admin(current_user)
    service = BackupService()
    try:
        result = service.delete_backup(backup_name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Backup not found") from exc
    return {"message": "Backup deleted", **result}
