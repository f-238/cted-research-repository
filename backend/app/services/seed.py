from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.entities import Course, SystemSetting, Template, User
from app.services.settings import DEFAULT_SETTINGS, SETTINGS_KEY, save_administrative_settings

COURSES = [
    ("Bachelor of Elementary Education", "BEED"),
    ("Bachelor of Early Childhood Education", "BECED"),
    ("BSED English", "BSED-ENG"),
    ("BSED Filipino", "BSED-FIL"),
    ("BSED Mathematics", "BSED-MATH"),
    ("BSED Science", "BSED-SCI"),
    ("BSED Social Studies", "BSED-SS"),
    ("BSED Values Education", "BSED-VE"),
    ("BSED Physical Education", "BSED-PE"),
]


def seed_database(db: Session) -> None:
    settings = get_settings()
    existing_codes = {course.code for course in db.query(Course).all()}
    for index, (name, code) in enumerate(COURSES, start=1):
        if code not in existing_codes:
            db.add(Course(name=name, code=code, status="Active", display_order=index))
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
    if db.get(SystemSetting, SETTINGS_KEY) is None:
        save_administrative_settings(db, DEFAULT_SETTINGS)
    db.commit()
