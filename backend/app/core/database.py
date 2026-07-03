from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import get_settings

settings = get_settings()


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


database_url = normalize_database_url(settings.database_url or "sqlite:///./cte_repository.db")
is_postgres = database_url.startswith("postgresql")
connect_args = (
    {"prepare_threshold": None, "sslmode": "require"}
    if is_postgres
    else {"check_same_thread": False}
    if database_url.startswith("sqlite")
    else {}
)
engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
