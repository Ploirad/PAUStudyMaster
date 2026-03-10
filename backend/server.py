from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Response, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import sys
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import google.generativeai as genai
import PyPDF2
import io
import json
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection - will be initialized in lifespan
mongo_url = os.environ['MONGO_URL']
client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global client, db
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    logging.info("✅ MongoDB connected")
    yield
    # Shutdown
    if client:
        client.close()
        logging.info("✅ MongoDB connection closed")

# Create the main app with lifespan
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# LLM Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Determine which API key to use (priority: Gemini > OpenAI > Emergent)
API_KEY = GEMINI_API_KEY or OPENAI_API_KEY or EMERGENT_LLM_KEY
USING_GEMINI = bool(GEMINI_API_KEY)

# Configure Gemini if available
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Helper function for LLM calls using google.generativeai
async def call_llm(messages: List[Dict[str, str]], model: str = "gemini-3-pro-preview") -> str:
    """Helper function to call Gemini API using google.generativeai"""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    try:
        # Extract system message and user messages
        system_message = ""
        user_content = ""
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            elif msg["role"] == "user":
                user_content += msg["content"] + "\n"
        
        # Configure the model
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        # Create model instance
        model_instance = genai.GenerativeModel(
            model_name=model,
            generation_config=generation_config,
            system_instruction=system_message if system_message else "You are a helpful assistant."
        )
        
        # Generate content
        response = model_instance.generate_content(user_content.strip())
        
        return response.text
    except Exception as e:
        logging.error(f"Error calling LLM: {e}")
        raise HTTPException(status_code=500, detail=f"Error al llamar a la IA: {str(e)}")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subject_id: str = Field(default_factory=lambda: f"subj_{uuid.uuid4().hex[:8]}")
    user_id: str
    name: str
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "📚"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubjectCreate(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "📚"

class Schedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schedule_id: str = Field(default_factory=lambda: f"sch_{uuid.uuid4().hex[:8]}")
    user_id: str
    file_name: str
    file_content: str  # Text extracted from PDF/image
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Syllabus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    syllabus_id: str = Field(default_factory=lambda: f"syl_{uuid.uuid4().hex[:8]}")
    user_id: str
    subject_id: str
    file_name: str
    content: str  # Extracted text
    topics: List[str] = []  # AI-extracted topics
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Exam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    exam_id: str = Field(default_factory=lambda: f"exam_{uuid.uuid4().hex[:8]}")
    user_id: str
    subject_id: str
    subject_name: str
    title: str
    date: str  # ISO format date
    time: Optional[str] = None
    notes: Optional[str] = None
    reminder: Optional[bool] = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExamCreate(BaseModel):
    subject_id: str
    subject_name: str
    title: str
    date: str
    time: Optional[str] = None
    notes: Optional[str] = None
    reminder: Optional[bool] = True

class Flashcard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    flashcard_id: str = Field(default_factory=lambda: f"fc_{uuid.uuid4().hex[:8]}")
    user_id: str
    subject_id: str
    subject_name: str
    topic: str
    question: str
    correct_answer: str
    subsection_id: Optional[str] = None  # Relación con subsección del checklist
    subsection_name: Optional[str] = None  # Nombre de la subsección
    user_answer: Optional[str] = None
    score: Optional[float] = None  # 0-100
    feedback: Optional[str] = None
    last_reviewed: Optional[datetime] = None
    next_review: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FlashcardCreate(BaseModel):
    subject_id: str
    subject_name: str
    topic: str
    question: str
    correct_answer: str
    subsection_id: Optional[str] = None  # ID de la subsección relacionada
    subsection_name: Optional[str] = None  # Nombre de la subsección

class FlashcardUpdate(BaseModel):
    question: Optional[str] = None
    correct_answer: Optional[str] = None
    topic: Optional[str] = None
    subsection_id: Optional[str] = None
    subsection_name: Optional[str] = None

class FlashcardAnswer(BaseModel):
    flashcard_id: str
    user_answer: str

class DeckUpdate(BaseModel):
    subject_id: str
    subject_name: str
    topic: str
    
class Subsection(BaseModel):
    subsection_id: str = Field(default_factory=lambda: f"sub_{uuid.uuid4().hex[:8]}")
    name: str
    is_completed: bool = False
    score: Optional[float] = None

class ChecklistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str = Field(default_factory=lambda: f"cli_{uuid.uuid4().hex[:8]}")
    user_id: str
    subject_id: str
    subject_name: str
    topic: str
    subsections: List[Subsection] = []
    is_completed: bool = False
    score: Optional[float] = None
    next_review: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChecklistItemCreate(BaseModel):
    subject_id: str
    subject_name: str
    topic: str

class SubsectionCreate(BaseModel):
    name: str

class Resource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    resource_id: str = Field(default_factory=lambda: f"res_{uuid.uuid4().hex[:8]}")
    user_id: str
    subject_id: str
    file_name: str
    content: str
    extracted_questions: List[Dict[str, str]] = []  # [{question, answer, topic}]
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:8]}")
    user_id: str
    date: str
    plan_content: str  # AI-generated plan
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:8]}")
    user_id: str
    chat_type: str  # "parent" or subject_id
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    chat_type: str  # "parent" or subject_id
    context: Optional[Dict[str, Any]] = None

# ==================== HELPER FUNCTIONS ====================

async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> User:
    """Get current user from session token (cookie or header)"""
    session_token = None
    
    # Check cookies first
    if request:
        session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
        else:
            session_token = authorization
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

async def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logging.error(f"Error extracting PDF text: {e}")
        return ""

async def analyze_content_with_ai(content: str, prompt: str) -> str:
    """Use AI to analyze content"""
    try:
        messages = [
            {"role": "system", "content": "You are an educational content analyzer. Provide clear, structured responses."},
            {"role": "user", "content": f"{prompt}\n\nContent:\n{content}"}
        ]
        response = await call_llm(messages, model="gemini-3-pro-preview")
        return response
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        return "Error analyzing content"

def clean_json_response(response: str) -> str:
    """Clean AI response to extract pure JSON"""
    # Remove markdown code blocks
    response = response.strip()
    if response.startswith('```json'):
        response = response[7:]
    elif response.startswith('```'):
        response = response[3:]
    if response.endswith('```'):
        response = response[:-3]
    
    # Remove leading/trailing whitespace and quotes
    response = response.strip()
    
    return response

async def extract_topics_from_syllabus(content: str) -> List[str]:
    """Extract topics from syllabus using AI - returns main sections only"""
    prompt = f"""Analiza el siguiente temario y extrae SOLO los temas o secciones PRINCIPALES (no subtemas).

Reglas importantes:
1. Extrae ÚNICAMENTE los títulos de las secciones principales
2. NO incluyas subsecciones ni subtemas
3. NO uses comillas en los nombres
4. Devuelve un array JSON simple: ["Tema 1", "Tema 2", ...]
5. NO añadas explicaciones, SOLO el array JSON

Temario:
{content[:4000]}

Devuelve ÚNICAMENTE el array JSON, sin comillas adicionales ni formato markdown."""
    
    response = await analyze_content_with_ai(content, prompt)
    
    try:
        # Clean the response
        cleaned = clean_json_response(response)
        
        # Try to parse as JSON
        topics = json.loads(cleaned)
        
        if isinstance(topics, list):
            # Clean topic names (remove extra quotes and whitespace)
            cleaned_topics = []
            for topic in topics:
                if isinstance(topic, str):
                    # Remove extra quotes and clean whitespace
                    clean_topic = topic.strip().strip('"').strip("'").strip()
                    if clean_topic and len(clean_topic) > 0:
                        cleaned_topics.append(clean_topic)
            
            logging.info(f"✅ Extracted {len(cleaned_topics)} topics from syllabus")
            return cleaned_topics
        
    except json.JSONDecodeError as e:
        logging.error(f"JSON parsing error: {e}")
        logging.error(f"Raw response: {response[:500]}")
        
        # Fallback: extract lines that look like topics
        lines = response.split('\n')
        topics = []
        for line in lines:
            line = line.strip().strip('"').strip("'").strip(',').strip()
            # Skip empty lines, JSON artifacts, and very short lines
            if line and len(line) > 2 and not line.startswith('{') and not line.startswith('[') and not line.startswith('```'):
                # Remove common prefixes
                for prefix in ['- ', '* ', '• ', '+ ', '> ']:
                    if line.startswith(prefix):
                        line = line[len(prefix):].strip()
                topics.append(line)
        
        logging.warning(f"⚠️ Fallback parsing: extracted {len(topics)} topics")
        return topics[:50]  # Increased limit
    
    except Exception as e:
        logging.error(f"Error extracting topics: {e}")
        return []

async def extract_subsections_for_topic(topic: str, subject_name: str, syllabus_content: str) -> List[Dict[str, str]]:
    """Extract subsections for a specific topic using AI"""
    prompt = f"""Eres un asistente que analiza temarios educativos.

Asignatura: {subject_name}
Tema principal: {topic}

TAREA: Extrae las subsecciones o subtemas que pertenecen específicamente a "{topic}".

REGLAS IMPORTANTES:
1. Extrae SOLO las subsecciones/subtemas de "{topic}"
2. NO incluyas el tema principal
3. NO uses comillas en los nombres
4. Devuelve entre 3 y 12 subsecciones
5. Formato: [{{"name": "Subsección 1"}}, {{"name": "Subsección 2"}}]
6. NO añadas explicaciones ni formato markdown
7. Si no hay subsecciones claras, infiere las partes lógicas del tema

Contenido del temario:
{syllabus_content[:4000]}

Devuelve ÚNICAMENTE el array JSON."""
    
    response = await analyze_content_with_ai(syllabus_content, prompt)
    
    try:
        # Clean the response
        cleaned = clean_json_response(response)
        
        # Try to parse as JSON
        subsections_data = json.loads(cleaned)
        
        if isinstance(subsections_data, list):
            # Generate proper subsection objects
            subsections = []
            for sub_data in subsections_data[:12]:  # Increased limit to 12
                if isinstance(sub_data, dict) and "name" in sub_data:
                    name = sub_data["name"].strip().strip('"').strip("'").strip()
                    if name and len(name) > 0:
                        subsections.append({
                            "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                            "name": name,
                            "is_completed": False,
                            "score": None
                        })
                elif isinstance(sub_data, str):
                    # Handle if AI returns array of strings instead of objects
                    name = sub_data.strip().strip('"').strip("'").strip()
                    if name and len(name) > 0:
                        subsections.append({
                            "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                            "name": name,
                            "is_completed": False,
                            "score": None
                        })
            
            logging.info(f"✅ Extracted {len(subsections)} subsections for topic '{topic}'")
            return subsections
            
    except json.JSONDecodeError as e:
        logging.error(f"JSON parsing error for subsections: {e}")
        logging.error(f"Raw response: {response[:500]}")
        
        # Fallback: extract lines
        lines = response.split('\n')
        subsections = []
        for line in lines:
            line = line.strip().strip('"').strip("'").strip(',').strip()
            # Skip empty lines and JSON artifacts
            if line and len(line) > 2 and not line.startswith('{') and not line.startswith('[') and not line.startswith('```'):
                # Remove common prefixes
                for prefix in ['- ', '* ', '• ', '+ ', '> ', 'name:', '"name":', '"name" :']:
                    if line.lower().startswith(prefix.lower()):
                        line = line[len(prefix):].strip()
                
                # Remove "name" key if present
                if line.startswith('"') or line.startswith("'"):
                    line = line.strip('"').strip("'")
                
                if line and len(line) > 2:
                    subsections.append({
                        "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                        "name": line,
                        "is_completed": False,
                        "score": None
                    })
                    
                    if len(subsections) >= 12:
                        break
        
        logging.warning(f"⚠️ Fallback parsing: extracted {len(subsections)} subsections")
        return subsections
        
    except Exception as e:
        logging.error(f"Error extracting subsections: {e}")
        
    # Ultimate fallback: create generic subsections
    if not subsections:
        logging.warning(f"⚠️ Creating generic subsections for '{topic}'")
        return [
            {
                "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                "name": f"Introducción a {topic}",
                "is_completed": False,
                "score": None
            },
            {
                "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                "name": f"Conceptos clave de {topic}",
                "is_completed": False,
                "score": None
            },
            {
                "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
                "name": f"Aplicaciones de {topic}",
                "is_completed": False,
                "score": None
            }
        ]
    
    return []

async def extract_questions_from_resource(content: str) -> List[Dict[str, str]]:
    """Extract questions and exercises from resource using AI"""
    prompt = """Analyze this educational resource and extract questions/exercises that can be used for flashcards.
    Return ONLY a JSON array with this format:
    [{"question": "question text", "answer": "answer text", "topic": "topic name"}]
    Extract up to 15 questions. Make them varied and educational."""
    
    response = await analyze_content_with_ai(content, prompt)
    try:
        questions = json.loads(response)
        if isinstance(questions, list):
            return questions[:15]
    except:
        # Fallback: empty list
        return []
    return []

def calculate_next_review(last_score: float, current_interval_days: int = 1) -> datetime:
    """Calculate next review date using spaced repetition"""
    if last_score >= 90:
        interval = current_interval_days * 3
    elif last_score >= 75:
        interval = current_interval_days * 2
    elif last_score >= 60:
        interval = current_interval_days
    else:
        interval = max(1, current_interval_days // 2)
    
    return datetime.now(timezone.utc) + timedelta(days=interval)

# ==================== AUTH ROUTES ====================

@api_router.get("/auth/session")
async def get_session_data(x_session_id: str = Header(...)):
    """Exchange session_id for user data"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": x_session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to get session data")
            
            data = response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
            
            if existing_user:
                user = User(**existing_user)
            else:
                # Create new user
                user = User(
                    email=data["email"],
                    name=data["name"],
                    picture=data.get("picture")
                )
                user_dict = user.model_dump()
                user_dict['created_at'] = user_dict['created_at'].isoformat()
                await db.users.insert_one(user_dict)
            
            # Create session
            session = UserSession(
                user_id=user.user_id,
                session_token=data["session_token"],
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)
            )
            session_dict = session.model_dump()
            session_dict['expires_at'] = session_dict['expires_at'].isoformat()
            session_dict['created_at'] = session_dict['created_at'].isoformat()
            await db.user_sessions.insert_one(session_dict)
            
            return {
                "user": user.model_dump(),
                "session_token": session.session_token
            }
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Session exchange failed: {str(e)}")

@api_router.get("/auth/me")
async def get_current_user_info(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get current user info"""
    user = await get_current_user(authorization, request)
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Logout user"""
    user = await get_current_user(authorization, request)
    
    # Get session token
    session_token = None
    if request:
        session_token = request.cookies.get("session_token")
    if not session_token and authorization:
        session_token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    # Delete session
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie("session_token", path="/", domain=None)
    
    return {"message": "Logged out successfully"}

# ==================== SUBJECTS ROUTES ====================

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all subjects for current user"""
    user = await get_current_user(authorization, request)
    subjects = await db.subjects.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return subjects

@api_router.post("/subjects", response_model=Subject)
async def create_subject(
    subject_data: SubjectCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new subject"""
    user = await get_current_user(authorization, request)
    
    subject = Subject(
        user_id=user.user_id,
        name=subject_data.name,
        color=subject_data.color,
        icon=subject_data.icon
    )
    
    subject_dict = subject.model_dump()
    subject_dict['created_at'] = subject_dict['created_at'].isoformat()
    await db.subjects.insert_one(subject_dict)
    
    return subject

@api_router.put("/subjects/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str,
    subject_data: SubjectCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a subject"""
    user = await get_current_user(authorization, request)
    
    result = await db.subjects.update_one(
        {"subject_id": subject_id, "user_id": user.user_id},
        {"$set": {
            "name": subject_data.name,
            "color": subject_data.color,
            "icon": subject_data.icon
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject_doc = await db.subjects.find_one({"subject_id": subject_id}, {"_id": 0})
    return Subject(**subject_doc)

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a subject"""
    user = await get_current_user(authorization, request)
    
    result = await db.subjects.delete_one({"subject_id": subject_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return {"message": "Subject deleted successfully"}

# ==================== FILES ROUTES ====================

@api_router.post("/files/upload-schedule")
async def upload_schedule(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload schedule file (PDF)"""
    user = await get_current_user(authorization, request)
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = await extract_text_from_pdf(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    schedule = Schedule(
        user_id=user.user_id,
        file_name=file.filename,
        file_content=text
    )
    
    schedule_dict = schedule.model_dump()
    schedule_dict['uploaded_at'] = schedule_dict['uploaded_at'].isoformat()
    
    # Delete old schedules for this user
    await db.schedules.delete_many({"user_id": user.user_id})
    await db.schedules.insert_one(schedule_dict)
    
    return schedule

@api_router.get("/files/schedule")
async def get_schedule(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get user's schedule"""
    user = await get_current_user(authorization, request)
    
    schedule_doc = await db.schedules.find_one({"user_id": user.user_id}, {"_id": 0})
    if not schedule_doc:
        return None
    
    return Schedule(**schedule_doc)

@api_router.post("/files/upload-syllabus")
async def upload_syllabus(
    file: UploadFile = File(...),
    subject_id: str = Header(..., alias="subject-id"),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload syllabus file (PDF)"""
    user = await get_current_user(authorization, request)
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = await extract_text_from_pdf(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Get subject info
    subject_doc = await db.subjects.find_one({"subject_id": subject_id}, {"_id": 0})
    subject_name = subject_doc.get("name", "") if subject_doc else ""
    
    # Extract topics using AI
    topics = await extract_topics_from_syllabus(text)
    
    syllabus = Syllabus(
        user_id=user.user_id,
        subject_id=subject_id,
        file_name=file.filename,
        content=text,
        topics=topics
    )
    
    syllabus_dict = syllabus.model_dump()
    syllabus_dict['uploaded_at'] = syllabus_dict['uploaded_at'].isoformat()
    await db.syllabi.insert_one(syllabus_dict)
    
    # Auto-create checklist items from topics WITH subsections
    for topic in topics:
        # Extract subsections for this topic using AI
        subsections = await extract_subsections_for_topic(topic, subject_name, text)
        
        item = ChecklistItem(
            user_id=user.user_id,
            subject_id=subject_id,
            subject_name=subject_name,
            topic=topic,
            subsections=[Subsection(**sub) for sub in subsections]
        )
        item_dict = item.model_dump()
        item_dict['created_at'] = item_dict['created_at'].isoformat()
        await db.checklist_items.insert_one(item_dict)
    
    return syllabus

@api_router.get("/files/syllabi")
async def get_syllabi(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all syllabi for user"""
    user = await get_current_user(authorization, request)
    
    syllabi = await db.syllabi.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return syllabi

# ==================== RESOURCES ROUTES ====================

@api_router.post("/files/upload-resource")
async def upload_resource(
    file: UploadFile = File(...),
    subject_id: str = Header(..., alias="subject-id"),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Upload resource file (PDF) and extract questions with AI"""
    user = await get_current_user(authorization, request)
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    text = await extract_text_from_pdf(content)
    
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Extract questions using AI
    extracted_questions = await extract_questions_from_resource(text)
    
    resource = Resource(
        user_id=user.user_id,
        subject_id=subject_id,
        file_name=file.filename,
        content=text,
        extracted_questions=extracted_questions
    )
    
    resource_dict = resource.model_dump()
    resource_dict['uploaded_at'] = resource_dict['uploaded_at'].isoformat()
    await db.resources.insert_one(resource_dict)
    
    return resource

@api_router.get("/files/resources")
async def get_resources(
    subject_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all resources for user, optionally filtered by subject"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user.user_id}
    if subject_id:
        query["subject_id"] = subject_id
    
    resources = await db.resources.find(query, {"_id": 0}).to_list(100)
    return resources

@api_router.delete("/files/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a resource"""
    user = await get_current_user(authorization, request)
    
    result = await db.resources.delete_one({"resource_id": resource_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {"message": "Resource deleted successfully"}

@api_router.post("/flashcards/generate-from-resources")
async def generate_flashcards_from_resources(
    subject_id: str,
    count: int = 5,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Generate flashcards from resources for a specific subject"""
    user = await get_current_user(authorization, request)
    
    # Validate count
    if count < 1 or count > 50:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 50")
    
    # Get resources for this subject
    resources = await db.resources.find(
        {"user_id": user.user_id, "subject_id": subject_id},
        {"_id": 0}
    ).to_list(100)
    
    if not resources:
        raise HTTPException(status_code=404, detail="No resources found for this subject")
    
    # Get subject info
    subject_doc = await db.subjects.find_one({"subject_id": subject_id}, {"_id": 0})
    if not subject_doc:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Collect all extracted questions from resources
    all_questions = []
    for resource in resources:
        all_questions.extend(resource.get("extracted_questions", []))
    
    if not all_questions:
        raise HTTPException(status_code=400, detail="No questions found in resources. Upload resources with content first.")
    
    # Select random questions (or take first N if not enough)
    import random
    selected_questions = random.sample(all_questions, min(count, len(all_questions)))
    
    # Create flashcards
    created_flashcards = []
    for q in selected_questions:
        flashcard = Flashcard(
            user_id=user.user_id,
            subject_id=subject_id,
            subject_name=subject_doc["name"],
            topic=q.get("topic", "General"),
            question=q.get("question", ""),
            correct_answer=q.get("answer", ""),
            next_review=datetime.now(timezone.utc)
        )
        
        flashcard_dict = flashcard.model_dump()
        flashcard_dict['created_at'] = flashcard_dict['created_at'].isoformat()
        if flashcard_dict.get('next_review'):
            flashcard_dict['next_review'] = flashcard_dict['next_review'].isoformat()
        
        await db.flashcards.insert_one(flashcard_dict)
        created_flashcards.append(flashcard)
    
    return {
        "message": f"Created {len(created_flashcards)} flashcards successfully",
        "flashcards": created_flashcards,
        "count": len(created_flashcards)
    }

@api_router.post("/flashcards/import-csv")
async def import_flashcards_from_csv(
    file: UploadFile = File(...),
    subject_id: str = Header(..., alias="subject-id"),
    topic: str = Header(..., alias="topic"),
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Import flashcards from a CSV file (format: question,correct_answer)"""
    user = await get_current_user(authorization, request)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV")
    
    # Get subject info
    subject_doc = await db.subjects.find_one({"subject_id": subject_id}, {"_id": 0})
    if not subject_doc:
        raise HTTPException(status_code=404, detail="Asignatura no encontrada")
    
    try:
        # Read CSV file
        content = await file.read()
        decoded_content = content.decode('utf-8-sig')  # utf-8-sig handles BOM if present
        csv_reader = csv.DictReader(io.StringIO(decoded_content))
        
        # Validate CSV headers
        if not csv_reader.fieldnames or 'question' not in csv_reader.fieldnames or 'correct_answer' not in csv_reader.fieldnames:
            raise HTTPException(
                status_code=400, 
                detail="Formato CSV inválido. Debe tener las columnas: question,correct_answer"
            )
        
        # Parse CSV and create flashcards
        created_flashcards = []
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (1 is header)
            question = row.get('question', '').strip()
            correct_answer = row.get('correct_answer', '').strip()
            
            if not question or not correct_answer:
                logging.warning(f"Fila {row_num} omitida: pregunta o respuesta vacía")
                continue
            
            flashcard = Flashcard(
                user_id=user.user_id,
                subject_id=subject_id,
                subject_name=subject_doc["name"],
                topic=topic,
                question=question,
                correct_answer=correct_answer,
                next_review=datetime.now(timezone.utc)
            )
            
            flashcard_dict = flashcard.model_dump()
            flashcard_dict['created_at'] = flashcard_dict['created_at'].isoformat()
            if flashcard_dict.get('next_review'):
                flashcard_dict['next_review'] = flashcard_dict['next_review'].isoformat()
            
            await db.flashcards.insert_one(flashcard_dict)
            created_flashcards.append(flashcard)
        
        if not created_flashcards:
            raise HTTPException(status_code=400, detail="No se pudieron crear flashcards. Verifica el formato del CSV.")
        
        return {
            "message": f"¡Importadas {len(created_flashcards)} flashcards exitosamente al tema '{topic}'!",
            "count": len(created_flashcards),
            "subject": subject_doc["name"],
            "topic": topic
        }
    
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Error de codificación. Asegúrate de que el CSV esté en formato UTF-8")
    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el CSV: {str(e)}")
    except Exception as e:
        logging.error(f"Error importing CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Error al importar flashcards: {str(e)}")

# ==================== EXAMS ROUTES ====================

@api_router.get("/exams", response_model=List[Exam])
async def get_exams(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all exams for user"""
    user = await get_current_user(authorization, request)
    exams = await db.exams.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return exams

@api_router.post("/exams", response_model=Exam)
async def create_exam(
    exam_data: ExamCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new exam"""
    user = await get_current_user(authorization, request)
    
    exam = Exam(
        user_id=user.user_id,
        subject_id=exam_data.subject_id,
        subject_name=exam_data.subject_name,
        title=exam_data.title,
        date=exam_data.date,
        time=exam_data.time,
        notes=exam_data.notes,
        reminder=exam_data.reminder
    )
    
    exam_dict = exam.model_dump()
    exam_dict['created_at'] = exam_dict['created_at'].isoformat()
    await db.exams.insert_one(exam_dict)
    
    return exam

@api_router.put("/exams/{exam_id}", response_model=Exam)
async def update_exam(
    exam_id: str,
    exam_data: ExamCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update an exam"""
    user = await get_current_user(authorization, request)
    
    result = await db.exams.update_one(
        {"exam_id": exam_id, "user_id": user.user_id},
        {"$set": exam_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    exam_doc = await db.exams.find_one({"exam_id": exam_id}, {"_id": 0})
    return Exam(**exam_doc)

@api_router.delete("/exams/{exam_id}")
async def delete_exam(
    exam_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete an exam"""
    user = await get_current_user(authorization, request)
    
    result = await db.exams.delete_one({"exam_id": exam_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    return {"message": "Exam deleted successfully"}

# ==================== FLASHCARDS ROUTES ====================

@api_router.get("/flashcards", response_model=List[Flashcard])
async def get_flashcards(
    subject_id: Optional[str] = None,
    due_only: bool = False,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get flashcards for user"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user.user_id}
    if subject_id:
        query["subject_id"] = subject_id
    
    flashcards = await db.flashcards.find(query, {"_id": 0}).to_list(200)
    
    if due_only:
        now = datetime.now(timezone.utc)
        flashcards = [fc for fc in flashcards if fc.get("next_review") and datetime.fromisoformat(fc["next_review"]) <= now]
    
    return flashcards

@api_router.post("/flashcards", response_model=Flashcard)
async def create_flashcard(
    flashcard_data: FlashcardCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new flashcard"""
    user = await get_current_user(authorization, request)
    
    flashcard = Flashcard(
        user_id=user.user_id,
        subject_id=flashcard_data.subject_id,
        subject_name=flashcard_data.subject_name,
        topic=flashcard_data.topic,
        question=flashcard_data.question,
        correct_answer=flashcard_data.correct_answer,
        subsection_id=flashcard_data.subsection_id,
        subsection_name=flashcard_data.subsection_name,
        next_review=datetime.now(timezone.utc)
    )
    
    flashcard_dict = flashcard.model_dump()
    flashcard_dict['created_at'] = flashcard_dict['created_at'].isoformat()
    if flashcard_dict.get('next_review'):
        flashcard_dict['next_review'] = flashcard_dict['next_review'].isoformat()
    await db.flashcards.insert_one(flashcard_dict)
    
    return flashcard

@api_router.post("/flashcards/answer")
async def answer_flashcard(
    answer_data: FlashcardAnswer,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Submit and score flashcard answer"""
    user = await get_current_user(authorization, request)
    
    # Get flashcard
    flashcard_doc = await db.flashcards.find_one(
        {"flashcard_id": answer_data.flashcard_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not flashcard_doc:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # Score answer with AI
    prompt = f"""You are an educational AI grading flashcard answers.
    
Question: {flashcard_doc['question']}
Correct Answer: {flashcard_doc['correct_answer']}
Student Answer: {answer_data.user_answer}

Score the student's answer from 0-100 and provide brief feedback. Return ONLY a JSON object:
{{"score": <number 0-100>, "feedback": "<brief feedback>"}}
"""
    
    try:
        messages = [
            {"role": "system", "content": "You are an educational AI that scores student answers. Always return valid JSON."},
            {"role": "user", "content": prompt}
        ]
        response = await call_llm(messages, model="gemini-3-pro-preview")
        result = json.loads(response)
        score = result["score"]
        feedback = result["feedback"]
    except Exception as e:
        logging.error(f"AI scoring error: {e}")
        # Fallback scoring mejorado
        user_answer_lower = answer_data.user_answer.lower().strip()
        correct_answer_lower = flashcard_doc['correct_answer'].lower().strip()
        
        # Calcular similitud
        if user_answer_lower == correct_answer_lower:
            # Respuesta exacta
            score = 100.0
            feedback = "¡Perfecto! Respuesta exacta."
        elif user_answer_lower in correct_answer_lower or correct_answer_lower in user_answer_lower:
            # Respuesta parcialmente correcta
            similarity = len(set(user_answer_lower.split()) & set(correct_answer_lower.split())) / len(set(correct_answer_lower.split()))
            score = min(95.0, 60.0 + (similarity * 40))
            feedback = "¡Bien! Tu respuesta es correcta pero podrías ser más específico."
        else:
            # Respuesta incorrecta
            score = 20.0
            feedback = "No del todo correcto. Revisa el material y vuelve a intentarlo."
    
    # Calculate next review
    next_review = calculate_next_review(score)
    
    # Update flashcard
    await db.flashcards.update_one(
        {"flashcard_id": answer_data.flashcard_id},
        {"$set": {
            "user_answer": answer_data.user_answer,
            "score": score,
            "feedback": feedback,
            "last_reviewed": datetime.now(timezone.utc).isoformat(),
            "next_review": next_review.isoformat()
        }}
    )
    
    # ✨ NUEVA FUNCIONALIDAD: Auto-completar subsecciones con el mismo tema
    # Si la respuesta es correcta (score >= 75), buscar y completar subsecciones relacionadas
    subsections_completed = 0
    if score >= 75.0:
        flashcard_topic = flashcard_doc.get('topic', '').strip().lower()
        
        if flashcard_topic:
            # Buscar checklist items con subsecciones que coincidan con el tema de la flashcard
            checklist_items = await db.checklist_items.find(
                {"user_id": user.user_id},
                {"_id": 0}
            ).to_list(500)
            
            for item in checklist_items:
                subsections = item.get('subsections', [])
                updated = False
                
                for subsection in subsections:
                    # Comparar nombres de subsección con el tema de la flashcard (case-insensitive)
                    subsection_name = subsection.get('name', '').strip().lower()
                    
                    # Si el nombre coincide y no está completada, marcarla como completada
                    if subsection_name == flashcard_topic and not subsection.get('is_completed', False):
                        subsection['is_completed'] = True
                        subsection['score'] = score
                        updated = True
                        subsections_completed += 1
                
                # Si se actualizó alguna subsección, recalcular progreso del tema
                if updated:
                    total_subsections = len(subsections)
                    completed_subsections = sum(1 for s in subsections if s.get('is_completed', False))
                    
                    if total_subsections > 0:
                        topic_score = (completed_subsections / total_subsections) * 100
                        topic_is_completed = topic_score >= 75.0
                    else:
                        topic_score = 0
                        topic_is_completed = False
                    
                    # Actualizar el documento
                    await db.checklist_items.update_one(
                        {"item_id": item['item_id'], "user_id": user.user_id},
                        {"$set": {
                            "subsections": subsections,
                            "score": topic_score,
                            "is_completed": topic_is_completed
                        }}
                    )
    
    result = {
        "score": score,
        "feedback": feedback,
        "next_review": next_review.isoformat()
    }
    
    # Informar al usuario si se completaron subsecciones automáticamente
    if subsections_completed > 0:
        result["subsections_completed"] = subsections_completed
        result["message"] = f"¡Genial! Se completaron automáticamente {subsections_completed} subsección(es) relacionada(s)."
    
    return result

@api_router.put("/flashcards/{flashcard_id}")
async def update_flashcard(
    flashcard_id: str,
    flashcard_data: FlashcardUpdate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update a flashcard (question, answer, topic, or subsection)"""
    user = await get_current_user(authorization, request)
    
    # Build update dict with only provided fields
    update_dict = {}
    if flashcard_data.question is not None:
        update_dict["question"] = flashcard_data.question
    if flashcard_data.correct_answer is not None:
        update_dict["correct_answer"] = flashcard_data.correct_answer
    if flashcard_data.topic is not None:
        update_dict["topic"] = flashcard_data.topic
    if flashcard_data.subsection_id is not None:
        update_dict["subsection_id"] = flashcard_data.subsection_id
    if flashcard_data.subsection_name is not None:
        update_dict["subsection_name"] = flashcard_data.subsection_name
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.flashcards.update_one(
        {"flashcard_id": flashcard_id, "user_id": user.user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # Return updated flashcard
    flashcard_doc = await db.flashcards.find_one(
        {"flashcard_id": flashcard_id},
        {"_id": 0}
    )
    
    return Flashcard(**flashcard_doc)

@api_router.delete("/flashcards/{flashcard_id}")
async def delete_flashcard(
    flashcard_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a flashcard"""
    user = await get_current_user(authorization, request)
    
    result = await db.flashcards.delete_one({"flashcard_id": flashcard_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    return {"message": "Flashcard deleted successfully"}

# ==================== FLASHCARD DECKS (MAZOS) ROUTES ====================

@api_router.get("/flashcard-decks")
async def get_flashcard_decks(
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all flashcard decks (grouped by subject_id + topic)"""
    user = await get_current_user(authorization, request)
    
    # Get all flashcards for the user
    flashcards = await db.flashcards.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Group by subject_id + topic to create decks
    decks_dict = {}
    now = datetime.now(timezone.utc)
    
    for fc in flashcards:
        # Use a safe key for URLs and IDs
        # Instead of subject_id::topic which might have spaces or special chars
        # we'll use a more robust way to identify the deck
        subject_id = fc.get('subject_id', 'unknown')
        topic = fc.get('topic', 'General')
        deck_key = f"{subject_id}____{topic.replace(' ', '_')}"
        
        if deck_key not in decks_dict:
            # Calculate next review date for the deck (earliest card that needs review)
            decks_dict[deck_key] = {
                "deck_id": deck_key,
                "subject_id": subject_id,
                "subject_name": fc.get('subject_name', 'Sin Asignatura'),
                "topic": topic,
                "card_count": 0,
                "due_count": 0,
                "mastered_count": 0,
                "next_review": None,
                "earliest_review": None
            }
        
        # Update deck stats
        decks_dict[deck_key]["card_count"] += 1
        
        # Check if card is due for review
        if fc.get('next_review'):
            next_review_dt = datetime.fromisoformat(fc['next_review'])
            if next_review_dt <= now:
                decks_dict[deck_key]["due_count"] += 1
            
            # Track earliest review date
            if decks_dict[deck_key]["earliest_review"] is None or next_review_dt < decks_dict[deck_key]["earliest_review"]:
                decks_dict[deck_key]["earliest_review"] = next_review_dt
                decks_dict[deck_key]["next_review"] = fc['next_review']
        
        # Count mastered cards (score >= 90)
        if fc.get('score') and fc['score'] >= 90:
            decks_dict[deck_key]["mastered_count"] += 1
    
    # Convert to list and calculate days until review
    decks = list(decks_dict.values())
    for deck in decks:
        if deck['earliest_review']:
            days_until = (deck['earliest_review'] - now).days
            deck['days_until_review'] = max(0, days_until)
        else:
            deck['days_until_review'] = 0
        
        # Remove earliest_review (internal use only)
        deck.pop('earliest_review', None)
    
    return decks

@api_router.get("/flashcard-decks/{deck_id}")
async def get_deck_flashcards(
    deck_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get all flashcards for a specific deck"""
    user = await get_current_user(authorization, request)
    
    # Parse deck_id (format: subject_id____topic)
    parts = deck_id.split('____', 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid deck_id format")
            
    subject_id = parts[0]
    topic = parts[1].replace('_', ' ')
    
    flashcards = await db.flashcards.find(
        {"user_id": user.user_id, "subject_id": subject_id, "topic": topic},
        {"_id": 0}
    ).to_list(1000)
    
    return flashcards

@api_router.delete("/flashcard-decks/{deck_id}")
async def delete_flashcard_deck(
    deck_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete all flashcards in a deck"""
    user = await get_current_user(authorization, request)
    
    # Parse deck_id
    parts = deck_id.split('____', 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid deck_id format")
        
    subject_id = parts[0]
    topic = parts[1].replace('_', ' ')
    
    result = await db.flashcards.delete_many({
        "user_id": user.user_id, 
        "subject_id": subject_id, 
        "topic": topic
    })
    
    return {"message": f"Mazo eliminado correctamente. Se eliminaron {result.deleted_count} flashcards."}

@api_router.put("/flashcard-decks/{deck_id}")
async def update_flashcard_deck(
    deck_id: str,
    deck_data: Dict[str, Any],
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update topic/subject for all flashcards in a deck"""
    user = await get_current_user(authorization, request)
    
    parts = deck_id.split('____', 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid deck_id format")
        
    old_subject_id = parts[0]
    old_topic = parts[1].replace('_', ' ')
    
    new_subject_id = deck_data.get('subject_id')
    new_topic = deck_data.get('topic')
    new_subject_name = deck_data.get('subject_name')
    
    update_data = {}
    if new_subject_id: update_data['subject_id'] = new_subject_id
    if new_topic: update_data['topic'] = new_topic
    if new_subject_name: update_data['subject_name'] = new_subject_name
    
    if not update_data:
        return {"message": "No hay datos para actualizar"}
        
    result = await db.flashcards.update_many(
        {"user_id": user.user_id, "subject_id": old_subject_id, "topic": old_topic},
        {"$set": update_data}
    )
    
    return {"message": f"Mazo actualizado. {result.modified_count} flashcards modificadas."}
    subject_id, topic = parts
    
    # Get flashcards for this deck
    flashcards = await db.flashcards.find(
        {
            "user_id": user.user_id,
            "subject_id": subject_id,
            "topic": topic
        },
        {"_id": 0}
    ).to_list(200)
    
    if not flashcards:
        raise HTTPException(status_code=404, detail="Deck not found or empty")
    
    return flashcards
@api_router.put("/flashcard-decks/{deck_id}")
async def update_deck(
    deck_id: str,
    deck_data: DeckUpdate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update all flashcards in a deck (change subject and/or topic)"""
    user = await get_current_user(authorization, request)
    
    # Parse deck_id (format: subject_id_topic)
    parts = deck_id.split('_', 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid deck_id format")
    
    old_subject_id, old_topic = parts
    
    # Update all flashcards in this deck
    result = await db.flashcards.update_many(
        {
            "user_id": user.user_id,
            "subject_id": old_subject_id,
            "topic": old_topic
        },
        {"$set": {
            "subject_id": deck_data.subject_id,
            "subject_name": deck_data.subject_name,
            "topic": deck_data.topic
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    return {
        "message": f"Deck updated successfully. {result.modified_count} flashcards updated.",
        "updated_count": result.modified_count
    }


# ==================== CHECKLIST ROUTES ====================

@api_router.get("/checklists", response_model=List[ChecklistItem])
async def get_checklist_items(
    subject_id: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get checklist items for user"""
    user = await get_current_user(authorization, request)
    
    query = {"user_id": user.user_id}
    if subject_id:
        query["subject_id"] = subject_id
    
    items = await db.checklist_items.find(query, {"_id": 0}).to_list(200)
    return items

@api_router.post("/checklists", response_model=ChecklistItem)
async def create_checklist_item(
    item_data: ChecklistItemCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Create a new checklist item"""
    user = await get_current_user(authorization, request)
    
    item = ChecklistItem(
        user_id=user.user_id,
        subject_id=item_data.subject_id,
        subject_name=item_data.subject_name,
        topic=item_data.topic
    )
    
    item_dict = item.model_dump()
    item_dict['created_at'] = item_dict['created_at'].isoformat()
    await db.checklist_items.insert_one(item_dict)
    
    return item

@api_router.put("/checklists/{item_id}")
async def update_checklist_item(
    item_id: str,
    score: float,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update checklist item progress"""
    user = await get_current_user(authorization, request)
    
    # Calculate next review based on score
    next_review = calculate_next_review(score)
    
    is_completed = score >= 75.0
    
    result = await db.checklist_items.update_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"$set": {
            "score": score,
            "is_completed": is_completed,
            "next_review": next_review.isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    item_doc = await db.checklist_items.find_one({"item_id": item_id}, {"_id": 0})
    return ChecklistItem(**item_doc)

@api_router.delete("/checklists/{item_id}")
async def delete_checklist_item(
    item_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a checklist item"""
    user = await get_current_user(authorization, request)
    
    result = await db.checklist_items.delete_one({"item_id": item_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return {"message": "Checklist item deleted successfully"}

# ==================== SUBSECTIONS ROUTES ====================

@api_router.post("/checklists/{item_id}/subsections")
async def add_subsection(
    item_id: str,
    subsection_data: SubsectionCreate,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Add a new subsection to a checklist item"""
    user = await get_current_user(authorization, request)
    
    # Get checklist item
    item_doc = await db.checklist_items.find_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not item_doc:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Create new subsection
    new_subsection = {
        "subsection_id": f"sub_{uuid.uuid4().hex[:8]}",
        "name": subsection_data.name,
        "is_completed": False,
        "score": None
    }
    
    # Add to subsections array
    result = await db.checklist_items.update_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"$push": {"subsections": new_subsection}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return new_subsection

@api_router.put("/checklists/{item_id}/subsections/{subsection_id}")
async def update_subsection(
    item_id: str,
    subsection_id: str,
    name: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Update subsection name"""
    user = await get_current_user(authorization, request)
    
    result = await db.checklist_items.update_one(
        {
            "item_id": item_id,
            "user_id": user.user_id,
            "subsections.subsection_id": subsection_id
        },
        {"$set": {"subsections.$.name": name}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subsection not found")
    
    return {"message": "Subsection updated successfully"}

@api_router.put("/checklists/{item_id}/subsections/{subsection_id}/toggle")
async def toggle_subsection_complete(
    item_id: str,
    subsection_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Toggle subsection completion status"""
    user = await get_current_user(authorization, request)
    
    # Get the checklist item
    item_doc = await db.checklist_items.find_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not item_doc:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Find and toggle the subsection
    subsections = item_doc.get("subsections", [])
    updated = False
    for subsection in subsections:
        if subsection["subsection_id"] == subsection_id:
            subsection["is_completed"] = not subsection["is_completed"]
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Subsection not found")
    
    # Calculate topic completion based on subsections
    total_subsections = len(subsections)
    completed_subsections = sum(1 for s in subsections if s.get("is_completed", False))
    
    if total_subsections > 0:
        topic_score = (completed_subsections / total_subsections) * 100
        topic_is_completed = topic_score >= 75.0
    else:
        topic_score = 0
        topic_is_completed = False
    
    # Update the document
    result = await db.checklist_items.update_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"$set": {
            "subsections": subsections,
            "score": topic_score,
            "is_completed": topic_is_completed
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return {
        "message": "Subsection toggled successfully",
        "topic_score": topic_score,
        "topic_is_completed": topic_is_completed
    }

@api_router.delete("/checklists/{item_id}/subsections/{subsection_id}")
async def delete_subsection(
    item_id: str,
    subsection_id: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Delete a subsection from a checklist item"""
    user = await get_current_user(authorization, request)
    
    result = await db.checklist_items.update_one(
        {"item_id": item_id, "user_id": user.user_id},
        {"$pull": {"subsections": {"subsection_id": subsection_id}}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return {"message": "Subsection deleted successfully"}

# ==================== CHAT ROUTES ====================

@api_router.post("/chat")
async def chat_with_bot(
    chat_request: ChatRequest,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Chat with AI bot (parent or subject-specific)"""
    user = await get_current_user(authorization, request)
    
    # Save user message
    user_msg = ChatMessage(
        user_id=user.user_id,
        chat_type=chat_request.chat_type,
        role="user",
        content=chat_request.message
    )
    user_msg_dict = user_msg.model_dump()
    user_msg_dict['timestamp'] = user_msg_dict['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    # Get chat history
    history = await db.chat_messages.find(
        {"user_id": user.user_id, "chat_type": chat_request.chat_type},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(50)
    
    # Build context
    if chat_request.chat_type == "parent":
        # Get exams, schedule, and syllabi to provide full context
        exams = await db.exams.find({"user_id": user.user_id}).to_list(100)
        exam_context = "\n".join([f"- {e['subject_name']} on {e['date']} ({e.get('type', 'Exam')})" for e in exams])
        
        schedule_doc = await db.schedules.find_one({"user_id": user.user_id})
        schedule_context = schedule_doc['file_content'] if schedule_doc else "No hay horario subido."
        
        syllabi = await db.syllabi.find({"user_id": user.user_id}).to_list(100)
        syllabi_context = ""
        for s in syllabi:
            subj = await db.subjects.find_one({"subject_id": s['subject_id']})
            subj_name = subj['name'] if subj else "Unknown"
            syllabi_context += f"\nTemario de {subj_name} ({s['file_name']}):\n{s['content'][:1000]}...\n"
        
        system_msg = f"""You are a study planning AI assistant. Your role is to help students manage their time, exams, and study materials.

HORARIO DEL ESTUDIANTE:
{schedule_context}

EXÁMENES ACTUALES:
{exam_context}

RECURSOS Y TEMARIOS SUBIDOS:
{syllabi_context}

IMPORTANT: Use the information above to provide highly personalized recommendations.
If the user wants to ADD or EDIT an exam, you must first ask for their explicit permission to modify their records.
Once they give permission, you can provide a JSON block in your response that the system will process.

Format for adding/editing an exam (only after getting permission):
```json
{{
  "action": "upsert_exam",
  "exam": {{
    "subject_name": "Name of the subject",
    "date": "YYYY-MM-DD",
    "type": "Parcial/Final/etc",
    "notes": "Optional notes"
  }}
}}
```

Format for deleting an exam:
```json
{{
  "action": "delete_exam",
  "subject_name": "Name of the subject to remove"
}}
```
Provide specific, actionable study plans with time allocations and resources based on their specific schedule and uploaded materials."""
    else:
        # Subject-specific chatbot
        subject_doc = await db.subjects.find_one({"subject_id": chat_request.chat_type}, {"_id": 0})
        if not subject_doc:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        # Get specific resources for this subject
        syllabus_doc = await db.syllabi.find_one({"user_id": user.user_id, "subject_id": chat_request.chat_type})
        resources_context = f"\nRECURSOS DISPONIBLES:\nArchivo: {syllabus_doc['file_name']}\nContenido:\n{syllabus_doc['content'][:1500]}...\n" if syllabus_doc else "\nNo hay recursos específicos subidos para esta asignatura todavía."
        
        # Get flashcards for this subject
        flashcards = await db.flashcards.find({"user_id": user.user_id, "subject_id": chat_request.chat_type}).to_list(100)
        flashcards_context = "\nFLASHCARDS DE ESTA ASIGNATURA:\n" + "\n".join([f"- P: {f['question']} | R: {f['answer']}" for f in flashcards[:20]]) if flashcards else "\nNo hay flashcards creadas para esta asignatura."
        
        system_msg = f"""You are a {subject_doc['name']} tutor. Help students with:
- Understanding concepts based on their uploaded resources
- Solving problems step by step
- Practicing with their flashcards
- Generating mock exams

CONTEXTO ESPECÍFICO DE LA ASIGNATURA ({subject_doc['name']}):
{resources_context}
{flashcards_context}

Be clear, patient, and educational. Use the provided resources and flashcards to give context-aware answers and recommendations."""
    
    # Get AI response
    try:
        # Add context if provided
        context_str = ""
        if chat_request.context:
            context_str = f"\n\nContext: {json.dumps(chat_request.context)}"
        
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": chat_request.message + context_str}
        ]
        response = await call_llm(messages, model="gemini-3-pro-preview")
        
        # Save assistant message
        assistant_msg = ChatMessage(
            user_id=user.user_id,
            chat_type=chat_request.chat_type,
            role="assistant",
            content=response
        )
        assistant_msg_dict = assistant_msg.model_dump()
        assistant_msg_dict['timestamp'] = assistant_msg_dict['timestamp'].isoformat()
        await db.chat_messages.insert_one(assistant_msg_dict)
        
        return {
            "message": response,
            "timestamp": assistant_msg.timestamp.isoformat()
        }
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service unavailable")

@api_router.get("/chat/history")
async def get_chat_history(
    chat_type: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get chat history for a specific chat type"""
    user = await get_current_user(authorization, request)
    
    history = await db.chat_messages.find(
        {"user_id": user.user_id, "chat_type": chat_type},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    
    return history

@api_router.delete("/chat/history/{chat_type}")
async def clear_chat_history(
    chat_type: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Clear chat history for a specific chat type"""
    user = await get_current_user(authorization, request)
    
    await db.chat_messages.delete_many({"user_id": user.user_id, "chat_type": chat_type})
    
    return {"message": "Chat history cleared"}

# ==================== STUDY PLAN ROUTES ====================

@api_router.post("/study-plan/generate")
async def generate_study_plan(
    date: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Generate daily study plan"""
    user = await get_current_user(authorization, request)
    
    # Get user's schedule
    schedule_doc = await db.schedules.find_one({"user_id": user.user_id}, {"_id": 0})
    
    # Get subjects and syllabi
    subjects = await db.subjects.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    syllabi = await db.syllabi.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    # Get upcoming exams
    exams = await db.exams.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    # Build context
    context = f"Today's date: {date}\n\n"
    
    if schedule_doc:
        context += f"My Schedule:\n{schedule_doc['file_content'][:1000]}\n\n"
    
    context += "My Subjects:\n"
    for subj in subjects:
        context += f"- {subj['name']}\n"
    
    context += "\nUpcoming Exams:\n"
    for exam in exams[:5]:
        context += f"- {exam['subject_name']} on {exam['date']}\n"
    
    prompt = f"""{context}

Create a detailed study plan for today. Include:
1. Available study hours based on my schedule
2. Which subjects/topics to study (prioritize based on exam dates)
3. Specific time allocations
4. Study methods (active recall, practice problems, etc.)
5. Resources or exercises to use

Be specific and actionable."""
    
    try:
        messages = [
            {"role": "system", "content": "You are a study planning expert. Create detailed, personalized study plans."},
            {"role": "user", "content": prompt}
        ]
        response = await call_llm(messages, model="gemini-3-pro-preview")
        
        # Save plan
        plan = StudyPlan(
            user_id=user.user_id,
            date=date,
            plan_content=response
        )
        
        plan_dict = plan.model_dump()
        plan_dict['created_at'] = plan_dict['created_at'].isoformat()
        
        # Delete old plan for this date
        await db.study_plans.delete_many({"user_id": user.user_id, "date": date})
        await db.study_plans.insert_one(plan_dict)
        
        return plan
    except Exception as e:
        logging.error(f"Study plan generation error: {e}")
        raise HTTPException(status_code=500, detail=f"No se pudo generar el plan de estudio. Error: {str(e)}")

@api_router.get("/study-plan/{date}")
async def get_study_plan(
    date: str,
    authorization: Optional[str] = Header(None),
    request: Request = None
):
    """Get study plan for a specific date"""
    user = await get_current_user(authorization, request)
    
    plan_doc = await db.study_plans.find_one({"user_id": user.user_id, "date": date}, {"_id": 0})
    
    if not plan_doc:
        return None
    
    return StudyPlan(**plan_doc)

# ==================== TEST ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "PAU Study Master API - Powered by Google Gemini"}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add CORS middleware BEFORE including router
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router in the main app
app.include_router(api_router)

# Serve static files from the React build directory
# Detectar si estamos empaquetados o en desarrollo
if getattr(sys, 'frozen', False):
    # Ejecutando como ejecutable empaquetado
    base_path = Path(sys._MEIPASS)
    build_dir = base_path / 'frontend' / 'build'
else:
    # Ejecutando como script
    build_dir = Path(__file__).parent.parent / 'frontend' / 'build'

if build_dir.exists() and build_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(build_dir), html=True), name="static")
    logger.info(f"✅ Serving static files from {build_dir}")
else:
    logger.warning(f"⚠️ Build directory not found: {build_dir}")
    logger.warning("Frontend will not be available. API is still accessible at /api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
