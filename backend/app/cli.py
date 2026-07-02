import argparse
from app.core.database import Base, SessionLocal, engine
from app.core.migrations import run_startup_migrations
from app.services.seed import seed_database


def migrate() -> None:
    run_startup_migrations(engine)
    Base.metadata.create_all(bind=engine)


def seed() -> None:
    with SessionLocal() as db:
        seed_database(db)


def main() -> None:
    parser = argparse.ArgumentParser(description="CTED Repository deployment tasks")
    parser.add_argument("command", choices=["migrate", "seed", "init"], help="Task to run")
    args = parser.parse_args()

    if args.command in {"migrate", "init"}:
        migrate()
    if args.command in {"seed", "init"}:
        seed()


if __name__ == "__main__":
    main()
