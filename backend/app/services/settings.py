import json

from sqlalchemy.orm import Session

from app.models.entities import SystemSetting

SETTINGS_KEY = "administrative_settings"

DEFAULT_SETTINGS = {
    "repository": {
        "visibility": "JRMSU Internal Only",
        "auto_publish_approved": True,
        "allow_public_downloads": False,
        "require_login_download": True,
    },
    "submissions": {
        "accepted_file_types": {"pdf": True, "docx": True},
        "max_upload_size_mb": 25,
        "max_files_per_submission": 1,
    },
    "format_policy": {
        "paper_size": "A4",
        "accepted_fonts": {"times_new_roman": True, "arial": True},
        "font_sizes": {"times_new_roman": 12, "arial": 11},
        "line_spacing": "Double",
        "minimum_pages": 5,
        "maximum_pages": 12,
    },
    "academic_defaults": {
        "current_school_year": "2026-2027",
        "auto_submission_year": True,
    },
    "review_workflow": {
        "default_submission_status": "Pending Review",
        "notify_submitter": {"approval": True, "needs_revision": True, "rejection": True},
        "notify_adviser": True,
    },
    "notifications": {
        "coordinator": {
            "new_student_registration": True,
            "new_faculty_registration": True,
            "new_research_submission": True,
            "new_presentation_submission": True,
            "new_publication_submission": True,
            "new_utilization_submission": True,
            "new_completed_paper_submission": True,
        },
        "faculty": {
            "presentation_approved": True,
            "publication_approved": True,
            "utilization_approved": True,
            "completed_paper_approved": True,
            "needs_revision": True,
            "rejected": True,
        },
        "students": {
            "research_approved": True,
            "needs_revision": True,
            "rejected": True,
        },
    },
    "branding": {
        "jrmsu_logo": "",
        "cted_logo": "",
        "repository_name": "JRMSU Main Campus\nCollege of Teacher Education\nResearch Repository",
        "footer_text": "",
        "contact_email": "",
        "research_office_contact_number": "",
    },
    "backup": {
        "automatic_weekly_backup": False,
        "last_backup_date": "",
        "backup_status": "Not scheduled",
    },
}


def deep_merge(defaults, current):
    if not isinstance(defaults, dict) or not isinstance(current, dict):
        return current if current is not None else defaults
    merged = dict(defaults)
    for key, value in current.items():
        merged[key] = deep_merge(defaults.get(key), value)
    return merged


def get_administrative_settings(db: Session) -> dict:
    row = db.get(SystemSetting, SETTINGS_KEY)
    if not row:
        return DEFAULT_SETTINGS
    try:
        return deep_merge(DEFAULT_SETTINGS, json.loads(row.value or "{}"))
    except json.JSONDecodeError:
        return DEFAULT_SETTINGS


def save_administrative_settings(db: Session, settings: dict) -> dict:
    merged = deep_merge(DEFAULT_SETTINGS, settings)
    row = db.get(SystemSetting, SETTINGS_KEY)
    if not row:
        row = SystemSetting(key=SETTINGS_KEY, value=json.dumps(merged))
        db.add(row)
    else:
        row.value = json.dumps(merged)
    db.commit()
    return merged
