from sqlalchemy.orm import Session
from app.models.entities import Notification, User


def notify(db: Session, user_id: int, title: str, message: str, link: str | None = None) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, link=link))


def notify_admins(db: Session, title: str, message: str, link: str | None = None) -> None:
    admins = db.query(User).filter(User.role == "admin", User.is_active.is_(True)).all()
    for admin in admins:
        notify(db, admin.id, title, message, link)
