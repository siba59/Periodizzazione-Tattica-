from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import json
import bcrypt
import jwt
import aiofiles
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
from fpdf import FPDF
from seed_data import MODULES, EXERCISES

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=120), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo di token non valido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")

# Pydantic Models
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str

class LoginInput(BaseModel):
    email: str
    password: str

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    video_type: Optional[str] = None

class LessonCreate(BaseModel):
    module_id: str
    title: str
    content: str
    video_url: Optional[str] = ""
    video_type: Optional[str] = "none"
    duration_minutes: Optional[int] = 15

class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None

class ExerciseGenInput(BaseModel):
    principle: str
    category: Optional[str] = "generale"
    num_players: Optional[int] = 10

class PaymentConfirmInput(BaseModel):
    user_id: str
    
class CoursePriceInput(BaseModel):
    price: float
    currency: Optional[str] = "EUR"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(input: RegisterInput):
    email = input.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email gia registrata")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(input.password),
        "name": input.name,
        "role": "student",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "progress": {}
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    return {
        "id": user_id, "email": email, "name": input.name, "role": "student",
        "access_token": access_token, "refresh_token": refresh_token
    }

@api_router.post("/auth/login")
async def login(input: LoginInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    return {
        "id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "student"),
        "access_token": access_token, "refresh_token": refresh_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Logout effettuato"}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nessun refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Tipo token non valido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        return {"access_token": access_token}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token non valido")

# ==================== MODULE ROUTES ====================

@api_router.get("/modules")
async def get_modules():
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return modules

@api_router.get("/modules/{module_id}")
async def get_module(module_id: str):
    module = await db.modules.find_one({"id": module_id}, {"_id": 0})
    if not module:
        raise HTTPException(status_code=404, detail="Modulo non trovato")
    return module

@api_router.put("/modules/{module_id}")
async def update_module(module_id: str, input: ModuleUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore puo modificare i moduli")
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.modules.update_one({"id": module_id}, {"$set": update_data})
    module = await db.modules.find_one({"id": module_id}, {"_id": 0})
    return module

# ==================== LESSON ROUTES ====================

@api_router.get("/modules/{module_id}/lessons")
async def get_module_lessons(module_id: str):
    lessons = await db.lessons.find({"module_id": module_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return lessons

@api_router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lezione non trovata")
    return lesson

@api_router.post("/lessons")
async def create_lesson(input: LessonCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore puo creare lezioni")
    existing = await db.lessons.find({"module_id": input.module_id}).to_list(100)
    new_order = len(existing) + 1
    lesson_doc = {
        "id": f"les-{str(uuid.uuid4())[:8]}",
        "module_id": input.module_id,
        "order": new_order,
        "title": input.title,
        "content": input.content,
        "video_url": input.video_url or "",
        "video_type": input.video_type or "none",
        "duration_minutes": input.duration_minutes or 15
    }
    await db.lessons.insert_one(lesson_doc)
    lesson_doc.pop("_id", None)
    return lesson_doc

@api_router.put("/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, input: LessonUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore puo modificare le lezioni")
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    return lesson

# ==================== EXERCISE ROUTES ====================

@api_router.get("/exercises")
async def get_exercises(module_id: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if module_id:
        query["module_id"] = module_id
    if category:
        query["category"] = category
    exercises = await db.exercises.find(query, {"_id": 0}).to_list(100)
    return exercises

@api_router.get("/exercises/{exercise_id}")
async def get_exercise(exercise_id: str):
    exercise = await db.exercises.find_one({"id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Esercitazione non trovata")
    return exercise

# ==================== PROGRESS ROUTES ====================

@api_router.get("/progress")
async def get_progress(request: Request):
    user = await get_current_user(request)
    progress = await db.progress.find({"user_id": user["_id"]}, {"_id": 0}).to_list(1000)
    return progress

@api_router.post("/progress/{lesson_id}/complete")
async def mark_lesson_complete(lesson_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.progress.find_one({"user_id": user["_id"], "lesson_id": lesson_id})
    if existing:
        return {"message": "Gia completata", "completed": True}
    await db.progress.insert_one({
        "user_id": user["_id"],
        "lesson_id": lesson_id,
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Lezione completata!", "completed": True}

@api_router.get("/progress/summary")
async def get_progress_summary(request: Request):
    user = await get_current_user(request)
    completed = await db.progress.find({"user_id": user["_id"]}, {"_id": 0}).to_list(1000)
    completed_ids = [p["lesson_id"] for p in completed]
    total_lessons = await db.lessons.count_documents({})
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    module_progress = []
    for m in modules:
        m_lessons = await db.lessons.find({"module_id": m["id"]}, {"_id": 0}).to_list(100)
        m_completed = sum(1 for les in m_lessons if les["id"] in completed_ids)
        module_progress.append({
            "module_id": m["id"],
            "module_title": m["title"],
            "total_lessons": len(m_lessons),
            "completed_lessons": m_completed,
            "percentage": round((m_completed / len(m_lessons)) * 100) if m_lessons else 0
        })
    return {
        "total_lessons": total_lessons,
        "completed_lessons": len(completed_ids),
        "overall_percentage": round((len(completed_ids) / total_lessons) * 100) if total_lessons > 0 else 0,
        "modules": module_progress
    }

# ==================== AI CHAT ROUTES ====================

PT_SYSTEM_MESSAGE = """Sei il Maestro della Periodizzazione Tattica e del Calcio Relazionale. 
Rispondi sempre in italiano con empatia e profondita filosofica.
Collega sempre i concetti del calcio alla vita, ai sistemi complessi, all'armonia musicale.
Non dare risposte schematiche o dogmatiche - ogni risposta deve essere un viaggio di pensiero.
Parla di connessioni, frattali, armonia, e del pallone come anima del gioco.
Usa metafore, citazioni, e riferimenti alla filosofia della PT.
Sei un istruttore che parla direttamente al suo allievo, con calore e saggezza.
Ricorda: i principi non si cambiano, si trasformano. L'errore e la piu grande connessione.
Il morfociclo e ritmo, gioia, costruzione. Il caos e organizzazione."""

EXERCISE_GEN_SYSTEM_MESSAGE = """Sei un esperto di Periodizzazione Tattica. Genera esercitazioni calcistiche in italiano.
Ogni esercitazione deve includere:
- Titolo creativo
- Principio di gioco coinvolto
- Organizzazione (spazio, giocatori, materiale)
- Descrizione dettagliata
- Obiettivi tattici (lista)
- Varianti (lista)
- Collegamento filosofico al modello di gioco
Rispondi SOLO in formato JSON valido con i campi: title, principle, setup, description, objectives (array), variations (array), philosophical_link"""

def get_llm_api_key():
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Chiave AI non configurata")
    return api_key

async def load_chat_history(user_id: str, session_id: str):
    return await db.chat_messages.find(
        {"user_id": user_id, "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)

async def save_chat_messages(user_id: str, session_id: str, user_content: str, ai_content: str):
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"user_id": user_id, "session_id": session_id, "role": "user", "content": user_content, "created_at": now},
        {"user_id": user_id, "session_id": session_id, "role": "assistant", "content": ai_content, "created_at": now}
    ])

def parse_exercise_json(response_text: str) -> dict:
    clean = response_text.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()
        if clean.startswith("json"):
            clean = clean[4:].strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return {"title": "Esercitazione Generata", "description": response_text}

@api_router.post("/ai/chat")
async def ai_chat(input: ChatInput, request: Request):
    user = await get_current_user(request)
    session_id = input.session_id or str(uuid.uuid4())
    
    try:
        api_key = get_llm_api_key()
        history = await load_chat_history(user["_id"], session_id)
        
        messages = [{"role": "system", "content": PT_SYSTEM_MESSAGE}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": input.message})
        
        # Try emergentintegrations first (Emergent platform), fall back to openai
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(api_key=api_key, session_id=f"pt-{session_id}", system_message=PT_SYSTEM_MESSAGE)
            chat.with_model("openai", "gpt-4o")
            for msg in history:
                if msg["role"] == "user":
                    await chat.send_message(UserMessage(text=msg["content"]))
            response_text = await chat.send_message(UserMessage(text=input.message))
        except ImportError:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            completion = client.chat.completions.create(model="gpt-4o", messages=messages)
            response_text = completion.choices[0].message.content
        
        await save_chat_messages(user["_id"], session_id, input.message, response_text)
        return {"response": response_text, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore AI: {str(e)}")

@api_router.post("/ai/generate-exercise")
async def ai_generate_exercise(input: ExerciseGenInput, request: Request):
    await get_current_user(request)
    
    try:
        api_key = get_llm_api_key()
        prompt = f"Genera un'esercitazione per {input.num_players} giocatori basata sul principio: '{input.principle}'. Categoria: {input.category}."
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            chat = LlmChat(api_key=api_key, session_id=f"gen-{str(uuid.uuid4())}", system_message=EXERCISE_GEN_SYSTEM_MESSAGE)
            chat.with_model("openai", "gpt-4o")
            response_text = await chat.send_message(UserMessage(text=prompt))
        except ImportError:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": EXERCISE_GEN_SYSTEM_MESSAGE},
                    {"role": "user", "content": prompt}
                ]
            )
            response_text = completion.choices[0].message.content
        
        exercise_data = parse_exercise_json(response_text)
        return {"exercise": exercise_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI Exercise Gen error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore generazione: {str(e)}")

@api_router.get("/ai/chat-history")
async def get_chat_history(request: Request, session_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {"user_id": user["_id"]}
    if session_id:
        query["session_id"] = session_id
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(200)
    return messages

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/students")
async def get_students(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso non autorizzato")
    students = await db.users.find({"role": "student"}, {"password_hash": 0}).to_list(100)
    for s in students:
        s["_id"] = str(s["_id"])
    return students

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso non autorizzato")
    total_students = await db.users.count_documents({"role": "student"})
    total_modules = await db.modules.count_documents({})
    total_lessons = await db.lessons.count_documents({})
    total_exercises = await db.exercises.count_documents({})
    total_chats = await db.chat_messages.count_documents({})
    return {
        "total_students": total_students,
        "total_modules": total_modules,
        "total_lessons": total_lessons,
        "total_exercises": total_exercises,
        "total_chat_messages": total_chats
    }

# ==================== PAYMENT ROUTES ====================

COURSE_PRICE = 49.00  # Prezzo del corso in EUR
PAYPAL_EMAIL = os.environ.get("PAYPAL_EMAIL", "latuafrica@gmail.com")

@api_router.get("/payment/info")
async def get_payment_info():
    """Info corso e prezzo - pubblico"""
    return {
        "price": COURSE_PRICE,
        "currency": "EUR",
        "paypal_email": PAYPAL_EMAIL,
        "description": "Corso Periodizzazione Tattica & Calcio Relazionale - Accesso Completo"
    }

@api_router.get("/payment/status")
async def get_payment_status(request: Request):
    """Verifica se l'utente ha pagato"""
    user = await get_current_user(request)
    if user.get("role") == "admin":
        return {"has_paid": True, "role": "admin"}
    full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {"has_paid": full_user.get("has_paid", False)}

@api_router.post("/payment/record")
async def record_payment(request: Request):
    """L'utente registra il pagamento PayPal effettuato"""
    user = await get_current_user(request)
    body = await request.json()
    transaction_id = body.get("transaction_id", "")
    
    await db.payments.insert_one({
        "user_id": user["_id"],
        "user_email": user.get("email", ""),
        "user_name": user.get("name", ""),
        "amount": COURSE_PRICE,
        "currency": "EUR",
        "transaction_id": transaction_id,
        "status": "pending_verification",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Auto-approve PayPal payments (l'istruttore puo revocare dal pannello admin)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"has_paid": True, "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Pagamento registrato! Accesso completo attivato.", "has_paid": True}

@api_router.post("/admin/payment/confirm")
async def admin_confirm_payment(input: PaymentConfirmInput, request: Request):
    """Admin conferma/attiva manualmente un pagamento"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore")
    await db.users.update_one(
        {"_id": ObjectId(input.user_id)},
        {"$set": {"has_paid": True, "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Accesso attivato per l'allievo"}

@api_router.post("/admin/payment/revoke")
async def admin_revoke_payment(input: PaymentConfirmInput, request: Request):
    """Admin revoca l'accesso"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore")
    await db.users.update_one(
        {"_id": ObjectId(input.user_id)},
        {"$set": {"has_paid": False}}
    )
    return {"message": "Accesso revocato"}

@api_router.get("/admin/payments")
async def get_all_payments(request: Request):
    """Admin vede tutti i pagamenti"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore")
    payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return payments

@api_router.post("/admin/course-price")
async def update_course_price(input: CoursePriceInput, request: Request):
    """Admin aggiorna il prezzo del corso"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore")
    global COURSE_PRICE
    COURSE_PRICE = input.price
    await db.settings.update_one(
        {"key": "course_price"}, 
        {"$set": {"value": input.price, "currency": input.currency}},
        upsert=True
    )
    return {"message": f"Prezzo aggiornato a {input.price} {input.currency}"}

# ==================== LESSON ACCESS CONTROL ====================

@api_router.get("/lessons/{lesson_id}/access")
async def check_lesson_access(lesson_id: str, request: Request):
    """Verifica se l'utente puo accedere alla lezione"""
    try:
        user = await get_current_user(request)
        if user.get("role") == "admin":
            return {"can_access": True, "reason": "admin"}
        full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
        if full_user.get("has_paid", False):
            return {"can_access": True, "reason": "paid"}
    except HTTPException:
        user = None
    
    # Check if it's a free lesson (first lesson of each module, order == 1)
    lesson = await db.lessons.find_one({"id": lesson_id}, {"_id": 0})
    if lesson and lesson.get("order") == 1:
        return {"can_access": True, "reason": "free_preview"}
    
    return {"can_access": False, "reason": "payment_required"}

# ==================== PDF CERTIFICATE ====================

def _build_certificate_pdf(user_name: str, total_lessons: int) -> bytes:
    """Genera il PDF del certificato di completamento."""
    pdf = FPDF(orientation='L', unit='mm', format='A4')
    pdf.add_page()
    _draw_certificate_background(pdf)
    _draw_certificate_header(pdf)
    _draw_certificate_body(pdf, user_name, total_lessons)
    _draw_certificate_footer(pdf)
    return bytes(pdf.output())


def _draw_certificate_background(pdf: FPDF) -> None:
    """Disegna sfondo e bordi del certificato."""
    pdf.set_fill_color(10, 10, 10)
    pdf.rect(0, 0, 297, 210, 'F')
    pdf.set_draw_color(212, 175, 55)
    pdf.set_line_width(2)
    pdf.rect(10, 10, 277, 190)
    pdf.set_line_width(0.5)
    pdf.rect(14, 14, 269, 182)
    pdf.set_line_width(0.3)
    pdf.line(30, 50, 267, 50)
    pdf.line(30, 160, 267, 160)


def _draw_certificate_header(pdf: FPDF) -> None:
    """Disegna intestazione del certificato."""
    pdf.set_text_color(212, 175, 55)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_y(25)
    pdf.cell(0, 10, 'ACCADEMIA ALLENATORI', align='C')
    pdf.set_font('Helvetica', '', 28)
    pdf.set_y(55)
    pdf.cell(0, 15, 'CERTIFICATO DI COMPLETAMENTO', align='C')


def _draw_certificate_body(pdf: FPDF, user_name: str, total_lessons: int) -> None:
    """Disegna corpo centrale del certificato."""
    pdf.set_text_color(200, 200, 200)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_y(75)
    pdf.cell(0, 8, 'Si attesta che', align='C')

    pdf.set_text_color(212, 175, 55)
    pdf.set_font('Helvetica', 'B', 32)
    pdf.set_y(88)
    pdf.cell(0, 15, user_name, align='C')

    pdf.set_text_color(200, 200, 200)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_y(110)
    pdf.cell(0, 8, 'ha completato con successo il percorso formativo', align='C')

    pdf.set_text_color(212, 175, 55)
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_y(122)
    pdf.cell(0, 12, 'Periodizzazione Tattica & Calcio Relazionale', align='C')

    pdf.set_text_color(160, 160, 160)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_y(138)
    pdf.cell(0, 6, f'7 Moduli - {total_lessons} Lezioni - Esercitazioni Pratiche - Assistente AI', align='C')


def _draw_certificate_footer(pdf: FPDF) -> None:
    """Disegna pie di pagina del certificato."""
    today = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    pdf.set_text_color(200, 200, 200)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_y(165)
    pdf.cell(148, 8, f'Data: {today}', align='R')
    pdf.cell(148, 8, 'L\'Istruttore', align='L')

    pdf.set_text_color(212, 175, 55)
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_y(180)
    pdf.cell(0, 6, '"Finche c\'e gioia, c\'e corso. I principi non si cambiano, si trasformano."', align='C')

@api_router.get("/certificate/download")
async def download_certificate(request: Request):
    """Genera e scarica il certificato PDF di completamento."""
    user = await get_current_user(request)
    
    total_lessons = await db.lessons.count_documents({})
    completed = await db.progress.count_documents({"user_id": user["_id"]})
    
    if completed < total_lessons and user.get("role") != "admin":
        raise HTTPException(status_code=400, detail=f"Devi completare tutte le lezioni ({completed}/{total_lessons})")
    
    user_name = user.get("name", "Allievo")
    pdf_bytes = _build_certificate_pdf(user_name, total_lessons)
    safe_name = user_name.replace(' ', '_')
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Certificato_PT_{safe_name}.pdf"}
    )

# ==================== PUBLIC ROUTES (no auth needed) ====================

@api_router.get("/public/modules")
async def get_public_modules():
    """Moduli visibili a tutti con preview della prima lezione"""
    modules = await db.modules.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for mod in modules:
        lessons = await db.lessons.find({"module_id": mod["id"]}, {"_id": 0}).sort("order", 1).to_list(100)
        mod["total_lessons"] = len(lessons)
        # Include only first lesson as free preview
        mod["free_lesson"] = lessons[0] if lessons else None
        mod["lesson_titles"] = [{"id": les["id"], "title": les["title"], "order": les["order"], "is_free": les["order"] == 1} for les in lessons]
    return modules

# ==================== VIDEO UPLOAD ====================

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload/video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo l'istruttore puo caricare video")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File non trovato")
    return FileResponse(filepath)

# ==================== SEED & STARTUP ====================

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@periodizzazione.it")
    admin_password = os.environ.get("ADMIN_PASSWORD", "TatticaPT2024!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Istruttore",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin creato: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Password admin aggiornata")

async def seed_content():
    existing_modules = await db.modules.count_documents({})
    if existing_modules > 0:
        # Check if "Tutta PT a Modo mio" exists, seed it if missing
        await seed_tutta_pt_from_docx()
        return
    
    logger.info("Seeding moduli e lezioni...")
    for mod in MODULES:
        lessons = mod.pop("lessons", [])
        await db.modules.insert_one(mod)
        for lesson in lessons:
            lesson["module_id"] = mod["id"]
            await db.lessons.insert_one(lesson)
    
    for ex in EXERCISES:
        await db.exercises.insert_one(ex)
    
    logger.info(f"Seeded {len(MODULES)} moduli e {len(EXERCISES)} esercitazioni")
    # Also seed the docx module
    await seed_tutta_pt_from_docx()

async def seed_tutta_pt_from_docx():
    """Importa il modulo 'Tutta PT a Modo mio' dal file .docx se non esiste."""
    pt_module_id = "mod-pt-mio"
    if await db.modules.find_one({"id": pt_module_id}):
        return
    
    docx_path = Path(__file__).parent / 'tutta_pt.docx'
    if not docx_path.exists():
        logger.warning("File tutta_pt.docx non trovato, skip seed")
        return
    
    logger.info("Importazione 'Tutta PT a Modo mio' dal documento...")
    try:
        await _import_docx_module(docx_path, pt_module_id)
    except Exception as e:
        logger.error(f"Errore importazione docx: {e}")


async def _import_docx_module(docx_path: Path, module_id: str):
    """Esegue l'importazione del documento nel database."""
    from import_tutta_pt import extract_text_from_docx, split_into_lessons, _build_module_doc, _build_lesson_doc
    
    full_text = extract_text_from_docx(docx_path)
    lessons = split_into_lessons(full_text)
    if not lessons:
        logger.error("Nessuna lezione trovata nel documento")
        return
    
    max_order = await db.modules.count_documents({})
    await db.modules.insert_one(_build_module_doc(max_order + 1))
    
    for i, lesson_data in enumerate(lessons):
        await db.lessons.insert_one(_build_lesson_doc(i, lesson_data))
    
    logger.info(f"Importate {len(lessons)} lezioni in 'Tutta PT a Modo mio'")

async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.modules.create_index("id", unique=True)
    await db.modules.create_index("order")
    await db.lessons.create_index("id", unique=True)
    await db.lessons.create_index("module_id")
    await db.exercises.create_index("id", unique=True)
    await db.exercises.create_index("module_id")
    await db.progress.create_index([("user_id", 1), ("lesson_id", 1)], unique=True)
    await db.chat_messages.create_index([("user_id", 1), ("session_id", 1)])

@app.on_event("startup")
async def startup():
    await create_indexes()
    await seed_admin()
    await seed_content()
    # Load course price from DB
    global COURSE_PRICE
    price_setting = await db.settings.find_one({"key": "course_price"})
    if price_setting:
        COURSE_PRICE = price_setting.get("value", 49.00)
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {os.environ.get('ADMIN_EMAIL', 'admin@periodizzazione.it')}\n")
        f.write(f"- Password: {os.environ.get('ADMIN_PASSWORD', 'TatticaPT2024!')}\n- Role: admin\n\n")
        f.write("## Test Student\n- Register as new student via /api/auth/register\n\n")
        f.write("## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n- POST /api/auth/refresh\n")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
