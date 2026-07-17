from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# Models
from models.user import User
from models.course import Course
from models.chapter import Chapter
from models.resource import Resource

# Routes
from routes.auth import router as auth_router
from routes.course import router as course_router
from routes.chapter import router as chapter_router
from routes.resource import router as resource_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(course_router)
app.include_router(chapter_router)
app.include_router(resource_router)


@app.get("/")
def home():
    return {
        "message": "Backend Running"
    }