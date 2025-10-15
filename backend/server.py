from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str = "employee"  # employee, manager, hr_admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    employee_number: str
    department_id: Optional[str] = None
    position: str
    hire_date: datetime
    salary: float
    benefits: Optional[List[str]] = []
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    status: str = "active"  # active, on_leave, terminated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    user_id: str
    employee_number: str
    department_id: Optional[str] = None
    position: str
    hire_date: datetime
    salary: float
    benefits: Optional[List[str]] = []
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None

class LeaveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    leave_type: str  # vacation, sick, personal
    start_date: datetime
    end_date: datetime
    reason: str
    status: str = "pending"  # pending, approved, rejected
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str
    start_date: datetime
    end_date: datetime
    reason: str

class LeaveApproval(BaseModel):
    status: str  # approved or rejected
    approved_by: str

class PerformanceReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    reviewer_id: str
    review_period: str
    rating: float  # 1-5
    strengths: str
    areas_for_improvement: str
    goals: str
    comments: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PerformanceReviewCreate(BaseModel):
    employee_id: str
    reviewer_id: str
    review_period: str
    rating: float
    strengths: str
    areas_for_improvement: str
    goals: str
    comments: Optional[str] = None

class PayrollRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    pay_period: str
    gross_salary: float
    deductions: float
    net_salary: float
    payment_date: datetime
    status: str = "pending"  # pending, processed, paid
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PayrollRecordCreate(BaseModel):
    employee_id: str
    pay_period: str
    gross_salary: float
    deductions: float
    net_salary: float
    payment_date: datetime

class ChatMessage(BaseModel):
    message: str
    user_id: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump(exclude={'password'})
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_doc.pop('password', None)
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

# Department Routes
@api_router.post("/departments", response_model=Department)
async def create_department(dept: DepartmentCreate, current_user: User = Depends(get_current_user)):
    department = Department(**dept.model_dump())
    doc = department.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.departments.insert_one(doc)
    return department

@api_router.get("/departments", response_model=List[Department])
async def get_departments(current_user: User = Depends(get_current_user)):
    depts = await db.departments.find({}, {"_id": 0}).to_list(1000)
    for dept in depts:
        if isinstance(dept['created_at'], str):
            dept['created_at'] = datetime.fromisoformat(dept['created_at'])
    return depts

# Employee Routes
@api_router.post("/employees", response_model=Employee)
async def create_employee(emp: EmployeeCreate, current_user: User = Depends(get_current_user)):
    employee = Employee(**emp.model_dump())
    doc = employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['hire_date'] = doc['hire_date'].isoformat()
    await db.employees.insert_one(doc)
    return employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: User = Depends(get_current_user)):
    emps = await db.employees.find({}, {"_id": 0}).to_list(1000)
    for emp in emps:
        if isinstance(emp['created_at'], str):
            emp['created_at'] = datetime.fromisoformat(emp['created_at'])
        if isinstance(emp['hire_date'], str):
            emp['hire_date'] = datetime.fromisoformat(emp['hire_date'])
    return emps

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: User = Depends(get_current_user)):
    emp = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if isinstance(emp['created_at'], str):
        emp['created_at'] = datetime.fromisoformat(emp['created_at'])
    if isinstance(emp['hire_date'], str):
        emp['hire_date'] = datetime.fromisoformat(emp['hire_date'])
    return Employee(**emp)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, emp_update: EmployeeCreate, current_user: User = Depends(get_current_user)):
    doc = emp_update.model_dump()
    doc['hire_date'] = doc['hire_date'].isoformat()
    result = await db.employees.update_one({"id": employee_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return await get_employee(employee_id, current_user)

# Leave Routes
@api_router.post("/leave", response_model=LeaveRequest)
async def create_leave_request(leave: LeaveRequestCreate, current_user: User = Depends(get_current_user)):
    leave_req = LeaveRequest(**leave.model_dump())
    doc = leave_req.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    doc['end_date'] = doc['end_date'].isoformat()
    await db.leave_requests.insert_one(doc)
    return leave_req

@api_router.get("/leave", response_model=List[LeaveRequest])
async def get_leave_requests(current_user: User = Depends(get_current_user)):
    leaves = await db.leave_requests.find({}, {"_id": 0}).to_list(1000)
    for leave in leaves:
        if isinstance(leave['created_at'], str):
            leave['created_at'] = datetime.fromisoformat(leave['created_at'])
        if isinstance(leave['start_date'], str):
            leave['start_date'] = datetime.fromisoformat(leave['start_date'])
        if isinstance(leave['end_date'], str):
            leave['end_date'] = datetime.fromisoformat(leave['end_date'])
    return leaves

@api_router.put("/leave/{leave_id}/approve", response_model=LeaveRequest)
async def approve_leave(leave_id: str, approval: LeaveApproval, current_user: User = Depends(get_current_user)):
    result = await db.leave_requests.update_one(
        {"id": leave_id},
        {"$set": {"status": approval.status, "approved_by": approval.approved_by}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    leave = await db.leave_requests.find_one({"id": leave_id}, {"_id": 0})
    if isinstance(leave['created_at'], str):
        leave['created_at'] = datetime.fromisoformat(leave['created_at'])
    if isinstance(leave['start_date'], str):
        leave['start_date'] = datetime.fromisoformat(leave['start_date'])
    if isinstance(leave['end_date'], str):
        leave['end_date'] = datetime.fromisoformat(leave['end_date'])
    return LeaveRequest(**leave)

# Performance Review Routes
@api_router.post("/performance", response_model=PerformanceReview)
async def create_performance_review(review: PerformanceReviewCreate, current_user: User = Depends(get_current_user)):
    perf = PerformanceReview(**review.model_dump())
    doc = perf.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.performance_reviews.insert_one(doc)
    return perf

@api_router.get("/performance", response_model=List[PerformanceReview])
async def get_performance_reviews(current_user: User = Depends(get_current_user)):
    reviews = await db.performance_reviews.find({}, {"_id": 0}).to_list(1000)
    for review in reviews:
        if isinstance(review['created_at'], str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    return reviews

@api_router.get("/performance/employee/{employee_id}", response_model=List[PerformanceReview])
async def get_employee_reviews(employee_id: str, current_user: User = Depends(get_current_user)):
    reviews = await db.performance_reviews.find({"employee_id": employee_id}, {"_id": 0}).to_list(1000)
    for review in reviews:
        if isinstance(review['created_at'], str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    return reviews

# Payroll Routes
@api_router.post("/payroll", response_model=PayrollRecord)
async def create_payroll_record(payroll: PayrollRecordCreate, current_user: User = Depends(get_current_user)):
    record = PayrollRecord(**payroll.model_dump())
    doc = record.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['payment_date'] = doc['payment_date'].isoformat()
    await db.payroll_records.insert_one(doc)
    return record

@api_router.get("/payroll", response_model=List[PayrollRecord])
async def get_payroll_records(current_user: User = Depends(get_current_user)):
    records = await db.payroll_records.find({}, {"_id": 0}).to_list(1000)
    for record in records:
        if isinstance(record['created_at'], str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
        if isinstance(record['payment_date'], str):
            record['payment_date'] = datetime.fromisoformat(record['payment_date'])
    return records

@api_router.get("/payroll/employee/{employee_id}", response_model=List[PayrollRecord])
async def get_employee_payroll(employee_id: str, current_user: User = Depends(get_current_user)):
    records = await db.payroll_records.find({"employee_id": employee_id}, {"_id": 0}).to_list(1000)
    for record in records:
        if isinstance(record['created_at'], str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
        if isinstance(record['payment_date'], str):
            record['payment_date'] = datetime.fromisoformat(record['payment_date'])
    return records

# AI Chat Route
@api_router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(chat_msg: ChatMessage, current_user: User = Depends(get_current_user)):
    try:
        # Get employee context for the user
        employee = await db.employees.find_one({"user_id": current_user.id}, {"_id": 0})
        leave_requests = await db.leave_requests.find({"employee_id": employee.get('id') if employee else ''}, {"_id": 0}).to_list(100)
        
        context = f"""You are an AI HR Assistant. The current user is {current_user.full_name} ({current_user.role}).
        """
        
        if employee:
            context += f"""Employee details: Position: {employee.get('position')}, Department: {employee.get('department_id')}, 
            Hire Date: {employee.get('hire_date')}, Status: {employee.get('status')}.
            Leave requests: {len(leave_requests)} total."""
        
        # Initialize Claude chat
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"hr_chat_{current_user.id}",
            system_message=context
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        user_message = UserMessage(text=chat_msg.message)
        response_text = await chat.send_message(user_message)
        
        # Store chat history
        chat_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "message": chat_msg.message,
            "response": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_chat_history.insert_one(chat_record)
        
        return ChatResponse(response=response_text, timestamp=datetime.now(timezone.utc))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

@api_router.get("/")
async def root():
    return {"message": "HR Management API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()