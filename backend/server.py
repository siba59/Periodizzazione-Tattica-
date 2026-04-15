from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import secrets
import aiofiles
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
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
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
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
    
    from starlette.responses import JSONResponse
    response = JSONResponse(content={
        "id": user_id, "email": email, "name": input.name, "role": "student"
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return response

@api_router.post("/auth/login")
async def login(input: LoginInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    from starlette.responses import JSONResponse
    response = JSONResponse(content={
        "id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "student")
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout():
    from starlette.responses import JSONResponse
    response = JSONResponse(content={"message": "Logout effettuato"})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    token = request.cookies.get("refresh_token")
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
        from starlette.responses import JSONResponse
        response = JSONResponse(content={"message": "Token rinnovato"})
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=7200, path="/")
        return response
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
        m_completed = sum(1 for l in m_lessons if l["id"] in completed_ids)
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

@api_router.post("/ai/chat")
async def ai_chat(input: ChatInput, request: Request):
    user = await get_current_user(request)
    session_id = input.session_id or str(uuid.uuid4())
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Chiave AI non configurata")
        
        system_msg = """Sei il Maestro della Periodizzazione Tattica e del Calcio Relazionale. 
Rispondi sempre in italiano con empatia e profondita filosofica.
Collega sempre i concetti del calcio alla vita, ai sistemi complessi, all'armonia musicale.
Non dare risposte schematiche o dogmatiche - ogni risposta deve essere un viaggio di pensiero.
Parla di connessioni, frattali, armonia, e del pallone come anima del gioco.
Usa metafore, citazioni, e riferimenti alla filosofia della PT.
Sei un istruttore che parla direttamente al suo allievo, con calore e saggezza.
Ricorda: i principi non si cambiano, si trasformano. L'errore e la piu grande connessione.
Il morfociclo e ritmo, gioia, costruzione. Il caos e organizzazione."""
        
        # Get chat history from DB
        history = await db.chat_messages.find(
            {"user_id": user["_id"], "session_id": session_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        
        chat = LlmChat(api_key=api_key, session_id=f"pt-{session_id}", system_message=system_msg)
        chat.with_model("openai", "gpt-4o")
        
        # Replay history
        for msg in history:
            if msg["role"] == "user":
                user_msg = UserMessage(text=msg["content"])
                await chat.send_message(user_msg)
        
        # Send current message
        user_message = UserMessage(text=input.message)
        response_text = await chat.send_message(user_message)
        
        # Save messages to DB
        now = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_many([
            {"user_id": user["_id"], "session_id": session_id, "role": "user", "content": input.message, "created_at": now},
            {"user_id": user["_id"], "session_id": session_id, "role": "assistant", "content": response_text, "created_at": now}
        ])
        
        return {"response": response_text, "session_id": session_id}
    except ImportError:
        logger.error("emergentintegrations not installed")
        raise HTTPException(status_code=500, detail="Modulo AI non disponibile")
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore AI: {str(e)}")

@api_router.post("/ai/generate-exercise")
async def ai_generate_exercise(input: ExerciseGenInput, request: Request):
    user = await get_current_user(request)
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Chiave AI non configurata")
        
        system_msg = """Sei un esperto di Periodizzazione Tattica. Genera esercitazioni calcistiche in italiano.
Ogni esercitazione deve includere:
- Titolo creativo
- Principio di gioco coinvolto
- Organizzazione (spazio, giocatori, materiale)
- Descrizione dettagliata
- Obiettivi tattici (lista)
- Varianti (lista)
- Collegamento filosofico al modello di gioco
Rispondi SOLO in formato JSON valido con i campi: title, principle, setup, description, objectives (array), variations (array), philosophical_link"""
        
        chat = LlmChat(api_key=api_key, session_id=f"gen-{str(uuid.uuid4())}", system_message=system_msg)
        chat.with_model("openai", "gpt-4o")
        
        prompt = f"Genera un'esercitazione per {input.num_players} giocatori basata sul principio: '{input.principle}'. Categoria: {input.category}."
        user_message = UserMessage(text=prompt)
        response_text = await chat.send_message(user_message)
        
        import json
        try:
            # Try to parse JSON from response
            clean = response_text.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                if clean.endswith("```"):
                    clean = clean[:-3]
                clean = clean.strip()
                if clean.startswith("json"):
                    clean = clean[4:].strip()
            exercise_data = json.loads(clean)
        except json.JSONDecodeError:
            exercise_data = {"title": "Esercitazione Generata", "description": response_text, "principle": input.principle}
        
        return {"exercise": exercise_data}
    except ImportError:
        raise HTTPException(status_code=500, detail="Modulo AI non disponibile")
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
    students = await db.users.find({"role": "student"}, {"_id": 0, "password_hash": 0}).to_list(100)
    # Convert ObjectId if present
    for s in students:
        if "_id" in s:
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

from starlette.responses import FileResponse

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
