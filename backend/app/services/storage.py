import mimetypes
import tempfile
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from supabase import Client, create_client

from app.core.config import get_settings


@dataclass
class StoredUpload:
    storage_key: str
    original_filename: str
    file_type: str
    mime_type: str
    file_size: int
    temp_path: str


_client: Client | None = None


def _get_client() -> Client:
    global _client
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=500, detail="Supabase storage is not configured.")
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


def _content_type(filename: str, fallback: str | None = None) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return fallback or guessed or "application/octet-stream"


def store_upload(upload: UploadFile, folder: str, allowed: set[str]) -> StoredUpload:
    filename = upload.filename or "uploaded-file"
    suffix = Path(filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Only {', '.join(sorted(allowed))} files are accepted.")

    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = temp.name
    total = 0
    try:
        with temp:
            while chunk := upload.file.read(1024 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(status_code=413, detail=f"File exceeds the {settings.max_upload_size_mb} MB upload limit.")
                temp.write(chunk)

        mime_type = _content_type(filename, upload.content_type)
        storage_key = f"{folder}/{uuid4().hex}{suffix}"
        with open(temp_path, "rb") as file_obj:
            response = _get_client().storage.from_(settings.supabase_bucket).upload(
                storage_key,
                file_obj,
                file_options={"content-type": mime_type, "x-upsert": "true"},
            )
        if isinstance(response, dict) and response.get("error"):
            raise HTTPException(status_code=502, detail="Failed to upload file to Supabase Storage.")
        return StoredUpload(
            storage_key=storage_key,
            original_filename=filename,
            file_type=suffix.replace(".", ""),
            mime_type=mime_type,
            file_size=total,
            temp_path=temp_path,
        )
    except HTTPException:
        Path(temp_path).unlink(missing_ok=True)
        raise
    except Exception as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=502, detail=f"Failed to upload file to Supabase Storage: {exc}") from exc


def signed_url(storage_key: str | None, expires_in: int = 300) -> str:
    if not storage_key:
        raise HTTPException(status_code=404, detail="File not found.")
    try:
        response = _get_client().storage.from_(get_settings().supabase_bucket).create_signed_url(storage_key, expires_in)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Unable to create signed file URL: {exc}") from exc
    if isinstance(response, dict):
        url = response.get("signedURL") or response.get("signedUrl") or response.get("signed_url")
    else:
        url = getattr(response, "signed_url", None) or getattr(response, "signedURL", None)
    if not url:
        raise HTTPException(status_code=404, detail="Signed URL could not be generated for this file.")
    return url


def delete_file(storage_key: str | None) -> None:
    if not storage_key:
        return
    try:
        _get_client().storage.from_(get_settings().supabase_bucket).remove([storage_key])
    except Exception:
        return
