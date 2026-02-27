import json
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import quote, unquote, urlparse, urlunparse


class BackupService:
    """Create and manage application backups as zip archives."""

    BACKUP_NAME_RE = re.compile(r"^[A-Za-z0-9_.-]+\.zip$")

    def __init__(self) -> None:
        self.backend_root = Path(__file__).resolve().parents[1]
        self.backups_dir = self.backend_root / "backups"
        self.index_file = self.backups_dir / "index.json"
        self.uploads_dir = self.backend_root / "uploads"
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./xteam_pro.db")
        self.backups_dir.mkdir(parents=True, exist_ok=True)

    def list_backups(self) -> List[Dict[str, Any]]:
        items = self._load_index()
        # Sort newest first.
        return sorted(items, key=lambda item: item.get("created_at", ""), reverse=True)

    def create_backup(self, mode: str, created_by: str) -> Dict[str, Any]:
        include_db = mode in {"db", "db_media"}
        include_media = mode in {"media", "db_media"}
        if not include_db and not include_media:
            raise ValueError("Backup mode must include db and/or media")

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{ts}_{mode}.zip"
        backup_path = self.backups_dir / backup_name

        with tempfile.TemporaryDirectory(prefix="xteam_backup_") as temp_dir:
            staging = Path(temp_dir)

            manifest: Dict[str, Any] = {
                "created_at": datetime.utcnow().isoformat(),
                "mode": mode,
                "include_db": include_db,
                "include_media": include_media,
                "created_by": created_by,
                "files": [],
            }

            if include_db:
                db_dir = staging / "db"
                db_dir.mkdir(parents=True, exist_ok=True)
                db_file = self._export_database(db_dir)
                manifest["database_export"] = db_file.name

            if include_media:
                media_dst = staging / "media"
                if self.uploads_dir.exists():
                    shutil.copytree(self.uploads_dir, media_dst)
                else:
                    media_dst.mkdir(parents=True, exist_ok=True)
                    (media_dst / ".empty").write_text("No uploads directory found", encoding="utf-8")

            for path in staging.rglob("*"):
                if path.is_file():
                    manifest["files"].append(path.relative_to(staging).as_posix())

            (staging / "manifest.json").write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

            with zipfile.ZipFile(backup_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zipf:
                for path in staging.rglob("*"):
                    if path.is_file():
                        zipf.write(path, arcname=path.relative_to(staging).as_posix())

        record = {
            "name": backup_name,
            "mode": mode,
            "size_bytes": backup_path.stat().st_size,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": created_by,
        }
        self._append_index(record)
        return record

    def delete_backup(self, backup_name: str) -> Dict[str, Any]:
        path = self.get_backup_path(backup_name)
        if not path.exists():
            raise FileNotFoundError("Backup not found")
        path.unlink()

        items = [item for item in self._load_index() if item.get("name") != backup_name]
        self._save_index(items)
        return {"name": backup_name}

    def get_backup_path(self, backup_name: str) -> Path:
        if not self.BACKUP_NAME_RE.match(backup_name):
            raise ValueError("Invalid backup name")
        path = (self.backups_dir / backup_name).resolve()
        if path.parent != self.backups_dir.resolve():
            raise ValueError("Invalid backup path")
        return path

    def _load_index(self) -> List[Dict[str, Any]]:
        if not self.index_file.exists():
            return []
        try:
            raw = json.loads(self.index_file.read_text(encoding="utf-8"))
            if isinstance(raw, list):
                return [item for item in raw if isinstance(item, dict)]
            return []
        except Exception:
            return []

    def _save_index(self, items: List[Dict[str, Any]]) -> None:
        self.index_file.write_text(
            json.dumps(items, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _append_index(self, record: Dict[str, Any]) -> None:
        items = self._load_index()
        items.append(record)
        self._save_index(items)

    def _normalized_db_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql://", 1)
        if url.startswith("sqlite+aiosqlite:///"):
            return url.replace("sqlite+aiosqlite:///", "sqlite:///", 1)
        return url

    def _export_database(self, output_dir: Path) -> Path:
        db_url = self._normalized_db_url()
        if db_url.startswith("postgresql://"):
            output = output_dir / "database.sql"
            self._run_pg_dump(db_url, output)
            return output
        if db_url.startswith("sqlite:///"):
            source = self._resolve_sqlite_path(db_url)
            if not source.exists():
                raise RuntimeError(f"SQLite database file not found: {source}")
            output = output_dir / source.name
            shutil.copy2(source, output)
            return output
        raise RuntimeError(f"Unsupported DATABASE_URL for backup: {db_url}")

    def _resolve_sqlite_path(self, db_url: str) -> Path:
        raw = db_url.replace("sqlite:///", "", 1)
        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = (self.backend_root / candidate).resolve()
        return candidate

    def _run_pg_dump(self, db_url: str, output_path: Path) -> None:
        parsed = urlparse(db_url)
        username = unquote(parsed.username or "")
        password = unquote(parsed.password or "")
        hostname = parsed.hostname or "localhost"
        port = f":{parsed.port}" if parsed.port else ""

        auth = ""
        if username:
            auth = f"{quote(username)}@"
        safe_netloc = f"{auth}{hostname}{port}"
        safe_url = urlunparse((parsed.scheme, safe_netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))

        env = os.environ.copy()
        if password:
            env["PGPASSWORD"] = password

        cmd = [
            "pg_dump",
            "--format=plain",
            "--no-owner",
            "--no-privileges",
            "--file",
            str(output_path),
            safe_url,
        ]

        try:
            subprocess.run(cmd, check=True, env=env, capture_output=True, text=True)
        except FileNotFoundError as exc:
            raise RuntimeError("pg_dump not found in PATH") from exc
        except subprocess.CalledProcessError as exc:
            stderr = (exc.stderr or "").strip()
            raise RuntimeError(f"pg_dump failed: {stderr or exc}") from exc
