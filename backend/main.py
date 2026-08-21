from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import datetime
import uuid
import io
import os
import jwt
import urllib.request
import urllib.parse
import json
from pydantic import BaseModel

from backend.database import get_db
from backend.models import Student, Drive, EligibilityResult, MatchScore, Interview, ExceptionItem, Notification, AuditLog, User, UserProvider
from backend.agents.context_router import ContextRouter, ContextObject
from backend.agents.jd_intake_agent import JDIntakeAgent
from backend.agents.eligibility_agent import EligibilityAgent
from backend.agents.matching_agent import MatchingAgent
from backend.agents.scheduling_agent import SchedulingAgent
from backend.agents.coordination_agent import CoordinationAgent
from backend.agents.notification_agent import NotificationAgent
from backend.agents.exception_agent import ExceptionAgent
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.reporting_agent import ReportingAgent

app = FastAPI(title="Placement Ops - AI Recruiter Agent Backend")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Constants
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-key-change-in-production-12345")
JWT_ALGORITHM = "HS256"

# Helper: Create JWT
def create_custom_jwt(user_id: int, email: str, role: str):
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Helper: HTTP helpers for OAuth token exchange and profile fetching
def http_post_json(url: str, data: dict, headers: dict = None) -> dict:
    headers = headers or {}
    headers["Content-Type"] = "application/x-www-form-urlencoded"
    headers["Accept"] = "application/json"
    req_data = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

def http_get_json(url: str, headers: dict = None) -> dict:
    headers = headers or {}
    headers["Accept"] = "application/json"
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

# Helper: Format user payload for frontend consistency
def format_user_payload(user: User, db: Session):
    if user.role == "student":
        student = db.query(Student).filter(Student.email == user.email).first()
        if not student:
            student = Student(
                name=user.name or "Student User",
                email=user.email,
                branch="CSE",
                cgpa=8.5,
                tenth_pct=90.0,
                twelfth_pct=90.0,
                backlog_count=0,
                api_score=85.0,
                ssi_score=75.0,
                prs_score=80.0
            )
            db.add(student)
            db.commit()
            db.refresh(student)
        return {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "api_score": student.api_score,
            "ssi_score": student.ssi_score,
            "prs_score": student.prs_score,
            "profile_image": user.profile_image
        }
    elif user.role == "recruiter":
        company = "Acme Systems"
        if user.email and "@" in user.email:
            domain = user.email.split("@")[1].split(".")[0]
            if domain not in ["gmail", "yahoo", "outlook", "placement", "example"]:
                company = domain.capitalize()
        return {
            "name": user.name or "Recruiter Partner",
            "email": user.email,
            "company": company,
            "profile_image": user.profile_image
        }
    elif user.role == "tpo":
        tpo_users = [
            {"name": "Maya Chen", "email": "maya.chen@placement.edu", "phone": "+919999911111"},
            {"name": "Rajesh Kumar", "email": "rajesh.kumar@placement.edu", "phone": "+919999922222"},
            {"name": "Sunita Rao", "email": "sunita.rao@placement.edu", "phone": "+919999933333"}
        ]
        found = next((t for t in tpo_users if t["email"] == user.email), None)
        if found:
            return {
                "id": user.id,
                "name": found["name"],
                "email": user.email,
                "phone": found["phone"],
                "profile_image": user.profile_image
            }
        return {
            "id": user.id,
            "name": user.name or "Head of Placements",
            "email": user.email,
            "phone": "+919999999999",
            "profile_image": user.profile_image
        }
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "profile_image": user.profile_image
    }

# Route protection middleware
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
        
    path = request.url.path
    if path == "/" or path.startswith("/auth/") or path.startswith("/docs") or path.startswith("/openapi.json"):
        return await call_next(request)
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Not authenticated. Missing or invalid Authorization header."}
        )
        
    token = auth_header.split(" ")[1]
    if token.startswith("mock-"):
        # Allow mock tokens for backward compatibility and ease of testing
        return await call_next(request)
        
    try:
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return JSONResponse(status_code=401, content={"detail": "Session expired. Please log in again."})
    except jwt.InvalidTokenError:
        return JSONResponse(status_code=401, content={"detail": "Invalid token."})
        
    return await call_next(request)

@app.get("/")
def read_root():
    return {"message": "Placement Ops Core Multi-Agent API is running."}

# ==========================================
# AUTHENTICATION SCHEMA & ENDPOINTS
# ==========================================
class LoginRequest(BaseModel):
    role: str  # student, recruiter, tpo
    auth_method: str  # google, number, mail
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: Optional[str] = None
    google_token: Optional[str] = None

class SupabaseLoginRequest(BaseModel):
    access_token: str
    role: str  # student, recruiter, tpo
    provider: str  # google, linkedin, github

class EmailRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class EmailLoginRequest(BaseModel):
    email: str
    password: str

class OAuthCallbackRequest(BaseModel):
    provider: str
    code: str
    state: str
    role: str
    redirect_uri: str

def decode_supabase_token(token: str):
    if token.count('.') == 2:
        secret = os.environ.get("SUPABASE_JWT_SECRET")
        if not secret:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_JWT_SECRET is missing. Please define it in your backend environment variables to verify real JWTs."
            )
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid Supabase session signature: {str(e)}")
    else:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed: Expected a valid 3-part Supabase JWT access token."
        )

@app.post("/auth/register")
def register_email(req: EmailRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    user = User(
        name=req.name,
        email=req.email,
        role=req.role
    )
    user.set_password(req.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_custom_jwt(user.id, user.email, user.role)
    user_data = format_user_payload(user, db)
    
    return {
        "token": token,
        "role": user.role,
        "user": user_data
    }

@app.post("/auth/login-email")
def login_email(req: EmailLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.check_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    token = create_custom_jwt(user.id, user.email, user.role)
    user_data = format_user_payload(user, db)
    
    return {
        "token": token,
        "role": user.role,
        "user": user_data
    }

@app.get("/auth/oauth-url")
def get_oauth_url(provider: str, role: str, redirect_uri: str):
    state = str(uuid.uuid4())
    if provider == "google":
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "google-mock-client-id")
        url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=openid%20email%20profile&state={state}"
    elif provider == "linkedin":
        client_id = os.environ.get("LINKEDIN_CLIENT_ID", "linkedin-mock-client-id")
        url = f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope=openid%20profile%20email&state={state}"
    elif provider == "github":
        client_id = os.environ.get("GITHUB_CLIENT_ID", "github-mock-client-id")
        url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=user:email&state={state}"
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")
    return {"url": url, "state": state}

@app.post("/auth/oauth-callback")
def oauth_callback(req: OAuthCallbackRequest, db: Session = Depends(get_db)):
    is_mock = False
    client_id = os.environ.get(f"{req.provider.upper()}_CLIENT_ID")
    client_secret = os.environ.get(f"{req.provider.upper()}_CLIENT_SECRET")
    
    if not client_id or not client_secret or req.code.startswith("mock-code-"):
        is_mock = True
        
    email = None
    name = None
    profile_image = None
    provider_user_id = None
    
    if is_mock:
        suffix = req.code.split("-")[-1]
        provider_user_id = f"mock-{req.provider}-id-{suffix}"
        email = f"mock-{req.provider}-user-{suffix}@example.com"
        name = f"Mock {req.provider.capitalize()} User"
        profile_image = f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    else:
        try:
            if req.provider == "google":
                token_res = http_post_json("https://oauth2.googleapis.com/token", {
                    "code": req.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": req.redirect_uri,
                    "grant_type": "authorization_code"
                })
                access_token = token_res["access_token"]
                profile = http_get_json(f"https://www.googleapis.com/oauth2/v3/userinfo", {
                    "Authorization": f"Bearer {access_token}"
                })
                provider_user_id = profile["sub"]
                email = profile["email"]
                name = profile.get("name")
                profile_image = profile.get("picture")
                
            elif req.provider == "github":
                token_res = http_post_json("https://github.com/login/oauth/access_token", {
                    "code": req.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": req.redirect_uri
                })
                access_token = token_res["access_token"]
                profile = http_get_json("https://api.github.com/user", {
                    "Authorization": f"Bearer {access_token}",
                    "User-Agent": "Placement-Ops-OAuth"
                })
                provider_user_id = str(profile["id"])
                name = profile.get("name") or profile.get("login")
                profile_image = profile.get("avatar_url")
                email = profile.get("email")
                if not email:
                    emails = http_get_json("https://api.github.com/user/emails", {
                        "Authorization": f"Bearer {access_token}",
                        "User-Agent": "Placement-Ops-OAuth"
                    })
                    for e in emails:
                        if e.get("primary"):
                            email = e.get("email")
                            break
                            
            elif req.provider == "linkedin":
                token_res = http_post_json("https://www.linkedin.com/oauth/v2/accessToken", {
                    "code": req.code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": req.redirect_uri,
                    "grant_type": "authorization_code"
                })
                access_token = token_res["access_token"]
                profile = http_get_json("https://api.linkedin.com/v2/userinfo", {
                    "Authorization": f"Bearer {access_token}"
                })
                provider_user_id = profile["sub"]
                email = profile["email"]
                name = profile.get("name")
                profile_image = profile.get("picture")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"OAuth communication failed: {str(e)}")
            
    if not email:
        raise HTTPException(status_code=400, detail="OAuth provider did not return an email address.")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            profile_image=profile_image,
            role=req.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    prov = db.query(UserProvider).filter(
        UserProvider.user_id == user.id,
        UserProvider.provider == req.provider
    ).first()
    if not prov:
        prov = UserProvider(
            user_id=user.id,
            provider=req.provider,
            provider_user_id=provider_user_id
        )
        db.add(prov)
        db.commit()
        
    token = create_custom_jwt(user.id, user.email, user.role)
    user_data = format_user_payload(user, db)
    
    return {
        "token": token,
        "role": user.role,
        "user": user_data
    }

@app.post("/auth/supabase-login")
def supabase_login(req: SupabaseLoginRequest, db: Session = Depends(get_db)):
    payload = decode_supabase_token(req.access_token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token payload: missing email address.")
        
    metadata = payload.get("user_metadata", {})
    name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0].capitalize()

    if req.role == "student":
        student = db.query(Student).filter(Student.email == email).first()
        if not student:
            student = Student(
                name=name,
                email=email,
                branch="CSE",
                cgpa=8.5,
                tenth_pct=90.0,
                twelfth_pct=90.0,
                backlog_count=0,
                api_score=85.0,
                ssi_score=75.0,
                prs_score=80.0
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        return {
            "token": req.access_token,
            "role": "student",
            "is_signup": True,
            "user": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "api_score": student.api_score,
                "ssi_score": student.ssi_score,
                "prs_score": student.prs_score
            }
        }
        
    elif req.role == "recruiter":
        company = "Acme Systems"
        if email and "@" in email:
            domain = email.split("@")[1].split(".")[0]
            if domain not in ["gmail", "yahoo", "outlook", "placement", "example"]:
                company = domain.capitalize()
                
        return {
            "token": req.access_token,
            "role": "recruiter",
            "user": {
                "name": name,
                "email": email,
                "company": company
            }
        }
        
    elif req.role == "tpo":
        tpo_users = [
            {"id": 1, "name": "Maya Chen", "email": "maya.chen@placement.edu", "phone": "+919999911111"},
            {"id": 2, "name": "Rajesh Kumar", "email": "rajesh.kumar@placement.edu", "phone": "+919999922222"},
            {"id": 3, "name": "Sunita Rao", "email": "sunita.rao@placement.edu", "phone": "+919999933333"}
        ]
        
        found = next((t for t in tpo_users if t["email"] == email), None)
        if found:
            selected_tpo = found
        else:
            selected_tpo = {
                "id": 99,
                "name": name,
                "email": email,
                "phone": "+919999999999"
            }
            
        return {
            "token": req.access_token,
            "role": "tpo",
            "user": selected_tpo
        }
        
    else:
        raise HTTPException(status_code=400, detail="Invalid role specified")

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if req.role == "student":
        # Attempt to find student by email, default to first student if not provided
        email = req.email or "aditya.sharma@example.com"
        student = db.query(Student).filter(Student.email == email).first()
        if not student:
            # Fallback mock for demo
            student = db.query(Student).first()
        
        return {
            "token": f"mock-student-token-{student.id}",
            "role": "student",
            "user": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "api_score": student.api_score,
                "ssi_score": student.ssi_score,
                "prs_score": student.prs_score
            }
        }
        
    elif req.role == "recruiter":
        # Recruiter mock profile
        company = "Acme Systems"
        if req.email and "@" in req.email:
            company = req.email.split("@")[1].split(".")[0].capitalize()
        
        return {
            "token": f"mock-recruiter-token-{company.lower()}",
            "role": "recruiter",
            "user": {
                "name": f"{company} Recruiter Partner",
                "email": req.email or f"recruiter@{company.lower()}.com",
                "company": company
            }
        }
        
    elif req.role == "tpo":
        # 3 Head of Placement accounts
        tpo_users = [
            {"id": 1, "name": "Maya Chen", "email": "maya.chen@placement.edu", "phone": "+919999911111"},
            {"id": 2, "name": "Rajesh Kumar", "email": "rajesh.kumar@placement.edu", "phone": "+919999922222"},
            {"id": 3, "name": "Sunita Rao", "email": "sunita.rao@placement.edu", "phone": "+919999933333"}
        ]
        
        selected_tpo = tpo_users[0] # Default to Maya Chen
        
        # Verify method
        if req.auth_method == "google":
            # Match by mock token or search mail
            if req.email:
                found = next((t for t in tpo_users if t["email"] == req.email), None)
                if found: selected_tpo = found
        elif req.auth_method == "number":
            if req.phone:
                found = next((t for t in tpo_users if t["phone"] == req.phone), None)
                if found: selected_tpo = found
        elif req.auth_method == "mail":
            if req.email:
                found = next((t for t in tpo_users if t["email"] == req.email), None)
                if found: selected_tpo = found
                
        return {
            "token": f"mock-tpo-token-{selected_tpo['id']}",
            "role": "tpo",
            "user": selected_tpo
        }
        
    else:
        raise HTTPException(status_code=400, detail="Invalid role specified")



# ==========================================
# STUDENTS ENDPOINTS
# ==========================================
@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.name).all()

@app.get("/students/{id}")
def get_student_details(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ==========================================
# DRIVES (JD INTAKE) ENDPOINTS
# ==========================================
@app.get("/drives")
def get_drives(db: Session = Depends(get_db)):
    return db.query(Drive).order_by(Drive.created_at.desc()).all()

@app.get("/drives/{id}")
def get_drive(id: int, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
    return drive

class CreateDriveRequest(BaseModel):
    company_name: str
    jd_raw_text: str

class JDRequest(BaseModel):
    company_name: str
    jd_raw_text: str

@app.post("/drives")
def create_drive(req: JDRequest, db: Session = Depends(get_db)):
    # 1. Start intake session
    session_id = str(uuid.uuid4())
    task_id = str(uuid.uuid4())
    
    # Run JDIntakeAgent to parse raw text
    parsed = JDIntakeAgent.parse_jd(req.jd_raw_text)
    
    # Save parsed draft into Drive
    drive = Drive(
        company_name=req.company_name or parsed.get("company_name", "Unknown"),
        role_title=parsed.get("role_title"),
        jd_raw_text=req.jd_raw_text,
        required_skills=parsed.get("required_skills"),
        cgpa_cutoff=parsed.get("cgpa_cutoff"),
        eligible_branches=parsed.get("eligible_branches"),
        package_min=parsed.get("package_min"),
        package_max=parsed.get("package_max"),
        headcount=parsed.get("headcount"),
        status="draft",
        stage="intake"
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    
    # Return draft drive + explanations for review
    return {
        "drive": drive,
        "session_id": session_id,
        "task_id": task_id,
        "explanations": parsed.get("explanations")
    }

class ConfirmDriveRequest(BaseModel):
    company_name: str
    role_title: str
    cgpa_cutoff: float
    eligible_branches: List[str]
    package_min: float
    package_max: float
    headcount: int
    required_skills: Dict[str, List[str]]

@app.patch("/drives/{id}/confirm")
def confirm_drive(id: int, req: ConfirmDriveRequest, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    # Apply human-approved/modified fields
    drive.company_name = req.company_name
    drive.role_title = req.role_title
    drive.cgpa_cutoff = req.cgpa_cutoff
    drive.eligible_branches = req.eligible_branches
    drive.package_min = req.package_min
    drive.package_max = req.package_max
    drive.headcount = req.headcount
    drive.required_skills = req.required_skills
    drive.status = "published"
    
    db.commit()
    
    # Trigger EligibilityAgent in background via context object router
    context = ContextObject(
        drive_id=drive.id,
        task_id=str(uuid.uuid4()),
        session_id=str(uuid.uuid4()),
        payload={},
        routing=["EligibilityAgent"]
    )
    
    updated_context = ContextRouter.execute_next(context, db)
    
    # Log Audit
    audit = AuditLog(
        action="confirm_jd",
        target_type="drive",
        target_id=drive.id,
        performed_by="TPO",
        details=f"TPO confirmed JD extraction parameters. Drive status is now Published."
    )
    db.add(audit)
    db.commit()
    
    return {
        "drive": drive,
        "context_payload": updated_context.payload
    }

# ==========================================
# ELIGIBILITY ENDPOINTS
# ==========================================
@app.get("/drives/{id}/eligibility")
def get_drive_eligibility(id: int, db: Session = Depends(get_db)):
    results = db.query(EligibilityResult).filter(EligibilityResult.drive_id == id).all()
    
    output = []
    for r in results:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        if student:
            output.append({
                "eligibility_id": r.id,
                "student_id": student.id,
                "student_name": student.name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "backlog_count": student.backlog_count,
                "current_best_offer": student.current_best_offer,
                "eligible": r.eligible,
                "reason": r.reason,
                "overridden_by_tpo": r.overridden_by_tpo,
                "flagged_for_review": r.flagged_for_review
            })
            
    return output

class OverrideEligibilityRequest(BaseModel):
    eligible: bool
    reason: str
    tpo_name: str = "TPO"

@app.patch("/eligibility/{id}/override")
def override_eligibility(id: int, req: OverrideEligibilityRequest, db: Session = Depends(get_db)):
    result = db.query(EligibilityResult).filter(EligibilityResult.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Eligibility record not found")
        
    student = db.query(Student).filter(Student.id == result.student_id).first()
    drive = db.query(Drive).filter(Drive.id == result.drive_id).first()
    
    old_status = result.eligible
    result.eligible = req.eligible
    result.overridden_by_tpo = True
    result.reason = f"[TPO Override] {req.reason} (Originally: {result.reason})"
    
    # Audit log
    audit = AuditLog(
        action="eligibility_override",
        target_type="eligibility",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"Overrode eligibility for student '{student.name if student else 'ID '+str(result.student_id)}' in drive '{drive.company_name if drive else 'ID '+str(result.drive_id)}'. Changed from {old_status} to {req.eligible}."
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Eligibility override applied successfully", "result": result}

# ==========================================
# SHORTLIST / MATCHING ENDPOINTS
# ==========================================
@app.get("/drives/{id}/shortlist")
def get_drive_shortlist(id: int, db: Session = Depends(get_db)):
    # If shortlist doesn't exist, we run matching agent.
    # Note: Shortlist is calculated based on eligible candidates.
    scores = db.query(MatchScore).filter(MatchScore.drive_id == id).order_by(MatchScore.rank).all()
    
    if not scores:
        # Run matching
        MatchingAgent.match_and_rank_students(id, db)
        scores = db.query(MatchScore).filter(MatchScore.drive_id == id).order_by(MatchScore.rank).all()

    output = []
    for s in scores:
        student = db.query(Student).filter(Student.id == s.student_id).first()
        if student:
            output.append({
                "match_id": s.id,
                "student_id": student.id,
                "student_name": student.name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "overall_score": s.overall_score,
                "skill_score": s.skill_score,
                "academic_score": s.academic_score,
                "project_score": s.project_score,
                "readiness_score": s.readiness_score,
                "feature_importance": s.feature_importance,
                "rank": s.rank,
                "approved": s.approved
            })
    return output

class ApproveShortlistRequest(BaseModel):
    approved_candidate_ids: List[int] # List of Student IDs approved
    tpo_name: str = "TPO"

@app.patch("/drives/{id}/shortlist/approve")
def approve_shortlist(id: int, req: ApproveShortlistRequest, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    # Reset all approved flags for this drive
    db.query(MatchScore).filter(MatchScore.drive_id == id).update({"approved": False})
    
    # Set approved flags for selected
    db.query(MatchScore).filter(
        MatchScore.drive_id == id,
        MatchScore.student_id.in_(req.approved_candidate_ids)
    ).update({"approved": True})
    
    drive.stage = "scheduling"
    db.commit()
    
    # Audit log
    audit = AuditLog(
        action="approve_shortlist",
        target_type="shortlist",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"TPO approved shortlist of {len(req.approved_candidate_ids)} candidates: {req.approved_candidate_ids}."
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"Shortlist of {len(req.approved_candidate_ids)} candidates approved and ready for scheduling."}

# ==========================================
# SCHEDULING & COORDINATION ENDPOINTS
# ==========================================
class ProposeScheduleRequest(BaseModel):
    panel_members: List[str]
    available_slots: List[str]
    rooms: List[str]

@app.post("/drives/{id}/schedule/propose")
def propose_schedule(id: int, req: ProposeScheduleRequest, db: Session = Depends(get_db)):
    proposed = SchedulingAgent.propose_schedule(
        id, req.panel_members, req.available_slots, req.rooms, db
    )
    
    # Perform coordination validation check immediately
    CoordinationAgent.validate_all_interviews(db)
    
    return proposed

@app.get("/drives/{id}/interviews")
def get_drive_interviews(id: int, db: Session = Depends(get_db)):
    interviews = db.query(Interview).filter(Interview.drive_id == id).all()
    output = []
    for intr in interviews:
        student = db.query(Student).filter(Student.id == intr.student_id).first()
        output.append({
            "interview_id": intr.id,
            "student_id": intr.student_id,
            "student_name": student.name if student else "Unknown",
            "panel_members": intr.panel_members,
            "room_or_link": intr.room_or_link,
            "time_slot": intr.time_slot,
            "status": intr.status,
            "conflict_flag": intr.conflict_flag
        })
    return output

class ConfirmScheduleRequest(BaseModel):
    tpo_name: str = "TPO"

@app.patch("/schedule/{id}/confirm")
def confirm_schedule(id: int, req: ConfirmScheduleRequest, db: Session = Depends(get_db)):
    # 'id' is drive_id
    drive = db.query(Drive).filter(Drive.id == id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    drive.stage = "coordination"
    db.commit()
    
    # Run Coordination check
    CoordinationAgent.validate_all_interviews(db)
    
    # Trigger notifications if no conflicts
    conflicts = db.query(Interview).filter(
        Interview.drive_id == id,
        Interview.conflict_flag == True
    ).count()
    
    audit = AuditLog(
        action="confirm_schedule",
        target_type="schedule",
        target_id=id,
        performed_by=req.tpo_name,
        details=f"TPO confirmed proposed schedule for drive ID {id}. Checked coordination anomalies: {conflicts} conflicts remaining."
    )
    db.add(audit)
    db.commit()
    
    if conflicts == 0:
        # Move drive stage to notified and send notifications
        context = ContextObject(
            drive_id=id,
            task_id=str(uuid.uuid4()),
            session_id=str(uuid.uuid4()),
            payload={},
            routing=["NotificationAgent"]
        )
        ContextRouter.execute_next(context, db)
        return {"message": "Schedule confirmed and notifications dispatched successfully. Stage set to notified."}
    else:
        return {"message": f"Schedule locked. However, {conflicts} coordination conflicts remain. Please resolve in the exceptions screen before dispatching.", "conflicts_found": True}

class ResolveInterviewRequest(BaseModel):
    time_slot: str
    room_or_link: str
    panel_members: List[str]
    tpo_name: str = "TPO"

@app.patch("/interviews/{id}/resolve")
def resolve_interview(id: int, req: ResolveInterviewRequest, db: Session = Depends(get_db)):
    res = CoordinationAgent.resolve_conflict(
        id, req.time_slot, req.room_or_link, req.panel_members, db, req.tpo_name
    )
    if not res:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"message": "Interview slot resolved and updated successfully."}

# ==========================================
# EXCEPTIONS ENDPOINTS
# ==========================================
@app.get("/exceptions")
def get_exceptions(db: Session = Depends(get_db)):
    exceptions = db.query(ExceptionItem).order_by(ExceptionItem.resolved, ExceptionItem.severity.desc()).all()
    output = []
    for exc in exceptions:
        drive = db.query(Drive).filter(Drive.id == exc.drive_id).first()
        output.append({
            "exception_id": exc.id,
            "drive_id": exc.drive_id,
            "company_name": drive.company_name if drive else "System Wide",
            "type": exc.type,
            "severity": exc.severity,
            "description": exc.description,
            "resolved": exc.resolved,
            "resolved_by": exc.resolved_by,
            "resolved_at": exc.resolved_at
        })
    return output

class ResolveExceptionRequest(BaseModel):
    resolved_by: str = "TPO"

@app.patch("/exceptions/{id}/resolve")
def resolve_exception(id: int, req: ResolveExceptionRequest, db: Session = Depends(get_db)):
    res = ExceptionAgent.resolve_exception(id, req.resolved_by, db)
    if not res:
        raise HTTPException(status_code=404, detail="Exception item not found")
    return {"message": "Exception marked as resolved."}

# ==========================================
# ANALYTICS ENDPOINTS
# ==========================================
@app.get("/analytics/skill-gap")
def get_skill_gap(db: Session = Depends(get_db)):
    return AnalyticsAgent.get_skill_gap_analysis(db)

@app.get("/analytics/readiness-trend")
def get_readiness_trend(db: Session = Depends(get_db)):
    return AnalyticsAgent.get_readiness_trends(db)

# ==========================================
# REPORTS ENDPOINTS
# ==========================================
@app.get("/reports/{drive_id}")
def get_drive_report(drive_id: int, db: Session = Depends(get_db)):
    # To support completed reports, let's mark the drive stage as completed if it was in notified stage
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    if drive and drive.stage in ["notified", "coordination", "scheduling"]:
        # Simulate drive completion
        drive.stage = "completed"
        drive.status = "closed"
        db.commit()

        # Update some interview statuses to 'completed' and 'no_show' for realistic stats
        interviews = db.query(Interview).filter(Interview.drive_id == drive_id).all()
        for idx, intr in enumerate(interviews):
            if idx % 5 == 0:
                intr.status = "no_show"
            else:
                intr.status = "completed"
        db.commit()

    return ReportingAgent.generate_drive_report(drive_id, db)

@app.get("/reports/{drive_id}/csv")
def get_drive_report_csv(drive_id: int, db: Session = Depends(get_db)):
    csv_str = ReportingAgent.export_report_csv(drive_id, db)
    drive = db.query(Drive).filter(Drive.id == drive_id).first()
    filename = f"{drive.company_name.lower().replace(' ', '_')}_placement_report.csv" if drive else "report.csv"
    
    return StreamingResponse(
        io.BytesIO(csv_str.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ==========================================
# AUDIT LOGS ENDPOINTS
# ==========================================
@app.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

# ==========================================
# NOTIFICATIONS FEED ENDPOINT
# ==========================================
@app.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).order_by(Notification.sent_at.desc()).all()
    output = []
    for n in notifications:
        student = db.query(Student).filter(Student.id == n.recipient_id).first()
        output.append({
            "notification_id": n.id,
            "drive_id": n.drive_id,
            "recipient_name": student.name if student else "Panelist",
            "recipient_type": n.recipient_type,
            "channel": n.channel,
            "message_template": n.message_template,
            "sent_at": n.sent_at,
            "delivery_status": n.delivery_status
        })
    return output
