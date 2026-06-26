from fastapi import FastAPI

from database import engine
from database import Base

from models.user import User

from routes.auth import router as auth_router

from models.course import Course

from routes.course import router as course_router
from fastapi.middleware.cors import CORSMiddleware


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


@app.get("/")
def home():

    return {
        "message": "Backend Running"
    }