"""
routes/resource.py
------------------
FastAPI router for PDF resource upload, retrieval, and deletion.

Endpoints
---------
POST /resources/upload                  -- Upload a PDF and index it into ChromaDB.
GET  /resources/chapter/:chapter_id     -- List all resources for a chapter.
DELETE /resources/:resource_id          -- Delete a resource and its vector chunks.

Upload Workflow (POST /resources/upload)
----------------------------------------
1. Admin submits a multipart form with the PDF file, chapter_id,
   title, description, and resource_type.
2. The file is validated (PDF-only, max 50 MB).
3. A UUID-prefixed filename is generated to prevent collisions.
4. The file is written to `uploads/resources/` on the local filesystem.
5. A Resource ORM record is created and committed to the database.
6. The PDF is parsed with pdfplumber and split into ~800-token chunks.
7. Chunks are embedded with Ollama's nomic-embed-text model and stored
   in the local ChromaDB vector store for AI Tutor retrieval.

The chunk count is returned in the response so admins can verify that
the indexing step succeeded.

Deletion Workflow (DELETE /resources/:id)
-----------------------------------------
1. The physical PDF file is removed from disk.
2. ChromaDB chunks associated with the resource_id are deleted from the
   vector store via a metadata filter.
3. The database record is deleted.

All three steps are performed within the same request so the system
stays consistent; partial failures are logged but do not roll back
the other cleanup steps.

Access Control
--------------
Upload and delete require a JWT with role="admin". The chapter resource
listing is public.

File Size Limit
---------------
MAX_FILE_SIZE is set to 50 MB (50 * 1024 * 1024 bytes). The limit is
enforced by seeking to the end of the upload stream before writing to
disk, avoiding storing oversized files.
"""

import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.resource import Resource
from models.chapter import Chapter
from schemas.resource import ResourceResponse
from utils.auth import verify_token
from services.rag_service import ingest_pdf, delete_resource_chunks

router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)

security = HTTPBearer()

# Storage path for uploaded PDF resources served by the static file mount.
UPLOAD_DIR = "uploads/resources"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Maximum accepted file size in bytes (50 MB).
# Enforced before writing to disk to prevent exhausting local storage.
MAX_FILE_SIZE = 50 * 1024 * 1024


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    FastAPI dependency that enforces admin-only access on a route.

    Returns:
        dict: Decoded JWT payload containing user_id, email, and role.

    Raises:
        HTTPException 401: Token is missing, malformed, or expired.
        HTTPException 403: Authenticated user is not an admin.
    """

    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid Token")

    if payload["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only Admin Allowed")

    return payload


@router.post("/upload")
async def upload_resource(
    file: UploadFile = File(...),
    chapter_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    resource_type: str = Form("Notes"),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    POST /resources/upload

    Accepts a PDF file via multipart form upload, persists it to disk,
    stores its metadata in the database, and indexes its text content
    into the ChromaDB vector store for AI Tutor retrieval.

    Form Fields:
    - file          (required): PDF file — only .pdf accepted.
    - chapter_id    (required): ID of the chapter this resource belongs to.
    - title         (required): Display name for the resource.
    - description   (optional): Admin notes about the document.
    - resource_type (optional): Classification label, defaults to "Notes".

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Resource uploaded — returns resource_id, file_url, chunks_ingested
        400 File is not a PDF
        400 File exceeds 50 MB
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Parent chapter not found
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Seek to the end to determine file size without loading it into memory,
    # then reset the cursor so the content can be read for writing.
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter Not Found")

    # Sanitise the original filename and prepend a UUID to guarantee
    # uniqueness even if the same filename is uploaded multiple times.
    safe_filename = file.filename.replace(" ", "_")
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    file_location = f"{UPLOAD_DIR}/{unique_filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resource = Resource(
        chapter_id=chapter_id,
        title=title,
        description=description,
        resource_type=resource_type,
        # Store the server-relative URL so it can be served via the /uploads mount.
        file_url=f"/{file_location}",
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    # Extract text, chunk it, embed with Ollama nomic-embed-text, and write
    # to ChromaDB with metadata tags for course/chapter scoped retrieval.
    chunks_ingested = ingest_pdf(
        file_path=file_location,
        resource_id=resource.id,
        chapter_id=chapter.id,
        course_id=chapter.course_id,
        title=title
    )

    return {
        "message": "Resource Uploaded Successfully",
        "resource_id": resource.id,
        "file_url": resource.file_url,
        "chunks_ingested": chunks_ingested
    }


@router.get("/chapter/{chapter_id}", response_model=list[ResourceResponse])
def get_chapter_resources(
    chapter_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /resources/chapter/:chapter_id

    Returns all resources attached to the specified chapter.

    Used by the student chapter viewer to display downloadable study
    materials alongside the lecture video.

    Responses:
        200 List of ResourceResponse objects (may be empty)
    """

    resources = db.query(Resource).filter(Resource.chapter_id == chapter_id).all()
    return resources


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    DELETE /resources/:resource_id

    Permanently removes a resource from the filesystem, the database,
    and the ChromaDB vector store.

    All three cleanup steps are performed in the same request to keep
    the filesystem, database, and vector index consistent. If the
    physical file has already been manually removed from disk, the
    deletion continues without raising an error.

    Authorization:
    - Bearer token with role="admin" required.

    Responses:
        200 Resource deleted
        401 Invalid or missing token
        403 Authenticated user is not an admin
        404 Resource not found
    """

    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource Not Found")

    # Strip the leading "/" to convert the stored server-relative URL
    # back to a filesystem-relative path before attempting deletion.
    file_path = resource.file_url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove all ChromaDB chunks tagged with this resource_id so the
    # AI Tutor no longer surfaces content from the deleted document.
    delete_resource_chunks(resource.id)

    db.delete(resource)
    db.commit()

    return {"message": "Resource Deleted"}