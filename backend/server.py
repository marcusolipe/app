from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import os
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

try:
    from backend.clerk_auth import clerk_router, require_user
except ModuleNotFoundError:
    from clerk_auth import clerk_router, require_user

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Roles ----------
ROLES = ["admin", "member"]
DEFAULT_ROLE = "member"
RETIRED_ROLES = {}
RANK = {r: len(ROLES) - i for i, r in enumerate(ROLES)}
ENV = "live" if os.environ.get("CLERK_PUBLISHABLE_KEY", "").startswith("pk_live_") else "preview"
IN_ENV = {"env": {"$in": [ENV, None]}}


def effective_role(role) -> str:
    role = RETIRED_ROLES.get(role, role)
    return role if role in ROLES else DEFAULT_ROLE


def _clerk_user(user_id: str) -> dict:
    r = requests.get(f"https://api.clerk.com/v1/users/{user_id}", timeout=10,
                     headers={"Authorization": f"Bearer {os.environ['CLERK_SECRET_KEY']}", "User-Agent": "emergent-app"})
    r.raise_for_status()
    return r.json()


def _is_admin_email(info: dict) -> bool:
    admins = {e.strip().lower() for e in os.environ.get("ADMIN_EMAIL", "").split(",") if e.strip()}
    return any(e["email_address"].lower() in admins and (e.get("verification") or {}).get("status") == "verified"
               for e in info["email_addresses"])


async def current_member(user: dict = Depends(require_user)) -> dict:
    uid = user["user_id"]
    member = await db.users.find_one({"user_id": uid}, {"_id": 0})
    if member is None or not member.get("role"):
        info = _clerk_user(uid)
        role = "admin" if _is_admin_email(info) else DEFAULT_ROLE
        email = (info.get("email_addresses") or [{}])[0].get("email_address", "")
        await db.users.update_one({"user_id": uid, "role": {"$in": [None, ""]}}, {"$set": {"role": role}})
        member = await db.users.find_one_and_update(
            {"user_id": uid}, {"$setOnInsert": {"user_id": uid, "role": role, "email": email}},
            upsert=True, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if member.get("env") != ENV:
        await db.users.update_one({"user_id": uid}, {"$set": {"env": ENV}})
    return {**member, "env": ENV, "role": effective_role(member["role"])}


def require_role(*roles: str):
    async def check(member: dict = Depends(current_member)) -> dict:
        if member["role"] not in roles:
            raise HTTPException(status_code=403, detail="Not allowed")
        return member
    return check


is_admin = require_role("admin")

# ---------- Storage ----------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "paty-investiga"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": init_storage(), "Content-Type": content_type}, data=data, timeout=300)
    if resp.status_code == 404:
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": init_storage(True), "Content-Type": content_type}, data=data, timeout=300)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------- Models ----------
PostType = Literal["noticia", "entrevista", "video", "reel", "coluna"]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class PostIn(BaseModel):
    type: PostType
    title: str
    summary: str = ""
    content: str = ""
    category: str = ""
    author: str = "Paty"
    cover_url: str = ""
    video_url: str = ""
    published: bool = True
    featured: bool = False


class Post(PostIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    likes: int = 0
    comments_count: int = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class CommentIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    content: str = Field(min_length=1, max_length=1500)


class Comment(CommentIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    created_at: str = Field(default_factory=now_iso)


class RoleIn(BaseModel):
    role: str


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"message": "PATY INVESTIGA API"}


@api_router.get("/posts", response_model=List[Post])
async def list_posts(type: Optional[PostType] = None, q: Optional[str] = None, limit: int = 50):
    query = {"published": True}
    if type:
        query["type"] = type
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    docs = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [Post(**d) for d in docs]


@api_router.get("/posts/{post_id}", response_model=Post)
async def get_post(post_id: str):
    doc = await db.posts.find_one({"id": post_id, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Postagem não encontrada")
    return Post(**doc)


@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, unlike: bool = False):
    doc = await db.posts.find_one_and_update(
        {"id": post_id, "published": True, **({"likes": {"$gt": 0}} if unlike else {})},
        {"$inc": {"likes": -1 if unlike else 1}}, projection={"_id": 0, "likes": 1},
        return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(404, "Postagem não encontrada")
    return {"likes": doc["likes"]}


@api_router.get("/posts/{post_id}/comments", response_model=List[Comment])
async def list_comments(post_id: str):
    docs = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Comment(**d) for d in docs]


@api_router.post("/posts/{post_id}/comments", response_model=Comment)
async def add_comment(post_id: str, body: CommentIn):
    if not await db.posts.find_one({"id": post_id, "published": True}, {"_id": 1}):
        raise HTTPException(404, "Postagem não encontrada")
    c = Comment(post_id=post_id, name=body.name.strip(), content=body.content.strip())
    await db.comments.insert_one(c.model_dump())
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    return c


@api_router.get("/files/{path:path}")
async def download(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Arquivo não encontrado")
    data, ct = get_object(path)
    return Response(content=data, media_type=record.get("content_type") or ct,
                    headers={"Cache-Control": "public, max-age=86400", "Accept-Ranges": "none"})


# ---------- Admin routes ----------
@api_router.get("/me")
async def me(member: dict = Depends(current_member)):
    return {"user_id": member["user_id"], "role": member["role"], "email": member.get("email", "")}


@api_router.get("/admin/posts", response_model=List[Post])
async def admin_posts(_: dict = Depends(is_admin)):
    docs = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Post(**d) for d in docs]


@api_router.post("/admin/posts", response_model=Post)
async def create_post(body: PostIn, _: dict = Depends(is_admin)):
    p = Post(**body.model_dump())
    await db.posts.insert_one(p.model_dump())
    return p


@api_router.put("/admin/posts/{post_id}", response_model=Post)
async def update_post(post_id: str, body: PostIn, _: dict = Depends(is_admin)):
    doc = await db.posts.find_one_and_update(
        {"id": post_id}, {"$set": {**body.model_dump(), "updated_at": now_iso()}},
        projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(404, "Postagem não encontrada")
    return Post(**doc)


@api_router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: str, _: dict = Depends(is_admin)):
    if (await db.posts.delete_one({"id": post_id})).deleted_count == 0:
        raise HTTPException(404, "Postagem não encontrada")
    await db.comments.delete_many({"post_id": post_id})
    return {"ok": True}


@api_router.get("/admin/comments")
async def admin_comments(_: dict = Depends(is_admin)):
    comments = await db.comments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    titles = {p["id"]: p["title"] for p in await db.posts.find({}, {"_id": 0, "id": 1, "title": 1}).to_list(2000)}
    return [{**Comment(**c).model_dump(), "post_title": titles.get(c["post_id"], "")} for c in comments]


@api_router.delete("/admin/comments/{comment_id}")
async def delete_comment(comment_id: str, _: dict = Depends(is_admin)):
    c = await db.comments.find_one_and_delete({"id": comment_id})
    if not c:
        raise HTTPException(404, "Comentário não encontrado")
    await db.posts.update_one({"id": c["post_id"], "comments_count": {"$gt": 0}}, {"$inc": {"comments_count": -1}})
    return {"ok": True}


ALLOWED_TYPES = ("image/", "video/")


@api_router.post("/admin/upload")
async def upload(file: UploadFile = File(...), member: dict = Depends(is_admin)):
    ct = file.content_type or ""
    if not ct.startswith(ALLOWED_TYPES):
        raise HTTPException(400, "Envie apenas imagens ou vídeos")
    data = await file.read()
    if len(data) > 200 * 1024 * 1024:
        raise HTTPException(400, "Arquivo muito grande (máx. 200MB)")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, ct)
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"], "original_filename": file.filename,
                               "content_type": ct, "size": result.get("size", len(data)), "is_deleted": False,
                               "uploaded_by": member["user_id"], "created_at": now_iso()})
    return {"url": f"/api/files/{result['path']}"}


@api_router.get("/users")
async def list_users(admin: dict = Depends(is_admin)):
    people = await db.users.find(IN_ENV, {"_id": 0}).to_list(1000)
    return {"roles": [r for r in ROLES if RANK[r] <= RANK[admin["role"]]],
            "users": [{**p, "role": effective_role(p.get("role"))} for p in people]}


@api_router.patch("/users/{user_id}/role")
async def set_role(user_id: str, body: RoleIn, admin: dict = Depends(is_admin)):
    if body.role not in ROLES or RANK[body.role] > RANK[admin["role"]]:
        raise HTTPException(403, "Not allowed")
    target = await db.users.find_one({"user_id": user_id, **IN_ENV}, {"_id": 0})
    if target is None:
        raise HTTPException(404, "Not found")
    if (effective_role(target.get("role")) == "admin" and body.role != "admin"
            and await db.users.count_documents({"role": "admin", **IN_ENV}) <= 1):
        raise HTTPException(409, "Keep at least one admin")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": body.role}})
    return {"user_id": user_id, "role": body.role}


# ---------- Seed ----------
IMG = {
    "ocean": "https://images.pexels.com/photos/20235073/pexels-photo-20235073.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "boats": "https://images.unsplash.com/photo-1664249501164-bde219efca11?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80",
    "flag": "https://images.unsplash.com/photo-1780388880896-db363cdc61be?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80",
    "studio": "https://images.unsplash.com/photo-1664277497087-51787d2b9d15?w=1200&q=80",
    "mic": "https://images.unsplash.com/photo-1554200876-980213841c94?w=1200&q=80",
    "magnifier": "https://images.unsplash.com/photo-1768839721041-437940836abb?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80",
}

SEED = [
    dict(type="noticia", featured=True, category="Cidade", cover_url=IMG["ocean"],
         title="Festival de Verão agita a orla de Angra dos Reis neste fim de semana",
         summary="Shows, gastronomia e atividades náuticas prometem lotar o centro histórico.",
         content="O tradicional Festival de Verão volta à orla de Angra dos Reis com uma programação para toda a família.\n\nSerão três dias de shows gratuitos, barracas de comidas típicas da Costa Verde e passeios de barco com descontos para moradores.\n\nA Paty Investiga foi conferir os bastidores e conta tudo para você!"),
    dict(type="noticia", category="Turismo", cover_url=IMG["boats"],
         title="Ilha Grande bate recorde de visitantes em junho",
         summary="Movimento nas praias e trilhas aumentou mais de 30% em relação ao ano passado.",
         content="A Ilha Grande registrou o maior número de visitantes da sua história no mês de junho.\n\nComerciantes comemoram, mas moradores pedem mais atenção à limpeza das praias."),
    dict(type="noticia", category="Utilidade pública", cover_url=IMG["flag"],
         title="Nova linha de ônibus liga o centro ao bairro Frade",
         summary="Horários ampliados atendem trabalhadores do turno da noite.",
         content="A prefeitura anunciou uma nova linha de ônibus que liga o centro ao Frade, com saídas a cada 40 minutos."),
    dict(type="entrevista", category="Personalidades", cover_url=IMG["mic"],
         title="Bate-papo com a chef que leva o sabor caiçara para o mundo",
         summary="Ela conta como transformou receitas da avó em sucesso.",
         content="PATY: Como tudo começou?\n\nCHEF: Na cozinha da minha avó, em frente ao mar de Angra. O peixe com banana era o prato de domingo...\n\nPATY: E qual o segredo?\n\nCHEF: Ingredientes frescos e muito amor pela nossa terra."),
    dict(type="entrevista", category="Esporte", cover_url=IMG["studio"],
         title="O jovem velejador de Angra que sonha com as Olimpíadas",
         summary="Aos 17 anos, ele já coleciona medalhas nacionais.",
         content="Conversamos com o atleta sobre treinos, rotina e o apoio da comunidade."),
    dict(type="video", category="Reportagem", cover_url=IMG["boats"], video_url="https://www.youtube.com/watch?v=ScMzIvxBSi4",
         title="Por dentro do Saco do Céu: a lagoa mais bonita da Costa Verde",
         summary="Uma reportagem em vídeo sobre preservação e turismo responsável.",
         content="Nossa equipe navegou até o Saco do Céu para mostrar as belezas e os desafios da região."),
    dict(type="reel", category="Rápidas", cover_url=IMG["ocean"], video_url="https://www.youtube.com/shorts/aqz-KE-bpKQ",
         title="Pôr do sol no cais de Santa Luzia", summary="30 segundos de pura magia."),
    dict(type="reel", category="Rápidas", cover_url=IMG["flag"], video_url="https://www.youtube.com/shorts/aqz-KE-bpKQ",
         title="Bastidores do festival", summary="Paty mostra a montagem do palco."),
    dict(type="coluna", category="Sociedade", cover_url=IMG["magnifier"],
         title="Paty no Agito: o aniversário mais comentado da Costa Verde",
         summary="Quem foi, o que vestiu e os detalhes que só a Paty viu.",
         content="Queridos leitores, a semana foi agitada!\n\nO aniversário da empresária mais querida de Angra reuniu nomes da sociedade em uma noite inesquecível na marina.\n\nDecoração tropical, DJ animado e muito brilho. A Paty estava lá e conta tudo!"),
]


@app.on_event("startup")
async def startup():
    for old, new in RETIRED_ROLES.items():
        await db.users.update_many({"role": old}, {"$set": {"role": new}})
    if await db.posts.count_documents({}) == 0:
        await db.posts.insert_many([Post(**s).model_dump() for s in SEED])
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


app.include_router(api_router)
app.include_router(clerk_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
