import re
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _submission_year_from_school_year(value: str | None) -> int:
    if not value:
        return 2026
    match = re.search(r"(20\d{2})", value)
    return int(match.group(1)) if match else 2026


def run_startup_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    _add_file_metadata_columns(engine, inspector, table_names)
    _add_user_profile_image_column(engine, inspector, table_names)

    if not engine.url.get_backend_name().startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "research_submissions" not in inspector.get_table_names():
        return

    legacy_group_column = "year" + "_level_id"
    columns = {column["name"] for column in inspector.get_columns("research_submissions")}
    if legacy_group_column not in columns and "submission_year" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE research_submissions RENAME TO research_submissions_legacy"))
        connection.execute(text("""
            CREATE TABLE research_submissions (
                id INTEGER NOT NULL PRIMARY KEY,
                title VARCHAR(260) NOT NULL,
                authors VARCHAR(260) NOT NULL,
                course_id INTEGER NOT NULL,
                section VARCHAR(40) NOT NULL,
                adviser VARCHAR(160) NOT NULL,
                school_year VARCHAR(20) NOT NULL,
                submission_year INTEGER NOT NULL,
                keywords VARCHAR(360) NOT NULL,
                abstract TEXT NOT NULL,
                status VARCHAR(14) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                original_filename VARCHAR(260) NOT NULL,
                file_type VARCHAR(20) NOT NULL,
                visible BOOLEAN NOT NULL,
                submitter_id INTEGER NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY(course_id) REFERENCES courses (id),
                FOREIGN KEY(submitter_id) REFERENCES users (id)
            )
        """))
        legacy_rows = connection.execute(text("SELECT * FROM research_submissions_legacy")).mappings().all()
        for row in legacy_rows:
            submission_year = row["submission_year"] if "submission_year" in row and row["submission_year"] else _submission_year_from_school_year(row["school_year"])
            connection.execute(text("""
                INSERT INTO research_submissions (
                    id, title, authors, course_id, section, adviser, school_year, submission_year,
                    keywords, abstract, status, file_path, original_filename, file_type, visible,
                    submitter_id, created_at, updated_at
                ) VALUES (
                    :id, :title, :authors, :course_id, :section, :adviser, :school_year, :submission_year,
                    :keywords, :abstract, :status, :file_path, :original_filename, :file_type, :visible,
                    :submitter_id, :created_at, :updated_at
                )
            """), {
                "id": row["id"],
                "title": row["title"],
                "authors": row["authors"],
                "course_id": row["course_id"],
                "section": row["section"],
                "adviser": row["adviser"],
                "school_year": row["school_year"],
                "submission_year": submission_year,
                "keywords": row["keywords"],
                "abstract": row["abstract"],
                "status": row["status"],
                "file_path": row["file_path"],
                "original_filename": row["original_filename"],
                "file_type": row["file_type"],
                "visible": row["visible"],
                "submitter_id": row["submitter_id"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            })
        connection.execute(text("DROP TABLE research_submissions_legacy"))


def _add_file_metadata_columns(engine: Engine, inspector, table_names: list[str]) -> None:
    with engine.begin() as connection:
        for table_name in ("research_submissions", "accomplishment_reports", "templates"):
            if table_name not in table_names:
                continue
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "mime_type" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN mime_type VARCHAR(120)"))
            if "file_size" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN file_size INTEGER"))


def _add_user_profile_image_column(engine: Engine, inspector, table_names: list[str]) -> None:
    if "users" not in table_names:
        return
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "profile_image_path" in columns:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN profile_image_path VARCHAR(500)"))
