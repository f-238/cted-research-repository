from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.migrations import run_startup_migrations
from app.services.seed import seed_database

settings = get_settings()
run_startup_migrations(engine)
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_database(db)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/")
def health():
    return {"status": "ok", "app": settings.app_name}
