from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Student
from app.models.schemas import StudentResponse, StudentCreate

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def get_students(
    branch: Optional[str] = None,
    min_cgpa: Optional[float] = None,
    placement_status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 150,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if branch:
        query = query.filter(Student.branch == branch)
    if min_cgpa is not None:
        query = query.filter(Student.cgpa >= min_cgpa)
    if placement_status:
        query = query.filter(Student.placement_status == placement_status)
    if search:
        s_term = f"%{search}%"
        query = query.filter((Student.name.ilike(s_term)) | (Student.roll_number.ilike(s_term)) | (Student.email.ilike(s_term)))
    
    return query.order_by(Student.cgpa.desc()).offset(skip).limit(limit).all()

@router.get("/{student_id}", response_model=StudentResponse)
def get_student_detail(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.roll_number == data.roll_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")
    student = Student(**data.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student
