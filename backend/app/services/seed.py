from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.entities import Course, Template, User

COURSES = [
    ("Bachelor of Secondary Education Major in English", "BSED-ENG"),
    ("Bachelor of Secondary Education Major in Mathematics", "BSED-MATH"),
    ("Bachelor of Secondary Education Major in Science", "BSED-SCI"),
    ("Bachelor of Secondary Education Major in Filipino", "BSED-FIL"),
    ("Bachelor of Secondary Education Major in Social Studies", "BSED-SS"),
    ("Bachelor of Secondary Education Major in Culture and Arts", "BSED-CA"),
    ("Bachelor of Secondary Education Major in Physical Education", "BSED-PE"),
    ("Bachelor of Elementary Education", "BEED"),
    ("Bachelor of Early Childhood Education", "BECED"),
]


def seed_database(db: Session) -> None:
    settings = get_settings()
    existing_codes = {course.code for course in db.query(Course).all()}
    for name, code in COURSES:
        if code not in existing_codes:
            db.add(Course(name=name, code=code))
    legacy_admin = db.query(User).filter(User.email == "admin@cte.local").first()
    current_admin = db.query(User).filter(User.email == settings.admin_email).first()
    if legacy_admin and current_admin:
        db.delete(legacy_admin)
    elif legacy_admin:
        legacy_admin.email = settings.admin_email
    if current_admin is None and legacy_admin is None:
        db.add(User(
            full_name="Research Coordinator",
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            role="admin",
            account_status="approved",
            is_active=True,
        ))
    if db.query(Template).count() == 0:
        db.add(Template(
            title="Official CTE Research Format",
            instructions=(
                "Use Times New Roman, 12 pt font, double spacing, school-approved margins, "
                "consistent heading styles, and include all required research sections before upload."
            ),
            is_active=True,
        ))
    db.commit()
