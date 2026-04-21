from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from api import faculties, departments, batches, teachers, rooms, courses
from api import scheduler, timetable, conflicts, export
from auth import router as auth_router

from dotenv import load_dotenv
load_dotenv()

# Import all models so Base knows about them before create_all
from models import faculty, department, batch, teacher, room, course, schedule

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GIKI Timetable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,        prefix="/api/auth")
app.include_router(faculties.router,   prefix="/api/faculties")
app.include_router(departments.router, prefix="/api/departments")
app.include_router(batches.router,     prefix="/api/batches")
app.include_router(teachers.router,    prefix="/api/teachers")
app.include_router(rooms.router,       prefix="/api/rooms")
app.include_router(courses.router,     prefix="/api/courses")
app.include_router(scheduler.router,   prefix="/api/scheduler")
app.include_router(timetable.router,   prefix="/api/timetable")
app.include_router(conflicts.router,   prefix="/api/conflicts")
app.include_router(export.router,      prefix="/api/export")
