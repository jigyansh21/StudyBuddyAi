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

router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)

security = HTTPBearer()

UPLOAD_DIR = "uploads/resources"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024 

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
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
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0) 
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter Not Found")

    # Filename Sanitization
    safe_filename = file.filename.replace(" ", "_")
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    file_location = f"{UPLOAD_DIR}/{unique_filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Future: Extract PDF Text
    # Future: Chunk Text
    # Future: Generate Embeddings
    # Future: Store into Vector DB

    resource = Resource(
        chapter_id=chapter_id,
        title=title,
        description=description,
        resource_type=resource_type,
        file_url=f"/{file_location}",
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    return {
        "message": "Resource Uploaded Successfully",
        "resource_id": resource.id,
        "file_url": resource.file_url
    }

@router.get("/chapter/{chapter_id}", response_model=list[ResourceResponse])
def get_chapter_resources(chapter_id: int, db: Session = Depends(get_db)):
    resources = db.query(Resource).filter(Resource.chapter_id == chapter_id).all()
    return resources

@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource Not Found")
    
    file_path = resource.file_url.lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(resource)
    db.commit()
    return {"message": "Resource Deleted"}