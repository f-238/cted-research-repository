from datetime import date, datetime
from typing import Optional
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

ROLE_VALUES = ("admin", "faculty", "student")
ACCOUNT_VALUES = ("pending", "approved", "rejected", "deactivated")
SUBMISSION_VALUES = ("Pending Review", "Approved", "Disapproved", "Needs Revision")
ACCOMPLISHMENT_VALUES = ("presentation", "publication", "utilization")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(220))
    role: Mapped[str] = mapped_column(Enum(*ROLE_VALUES, name="role_enum"), default="student")
    account_status: Mapped[str] = mapped_column(Enum(*ACCOUNT_VALUES, name="account_enum"), default="pending")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id"), nullable=True)
    section: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    profile_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    course = relationship("Course")
    submissions = relationship("ResearchSubmission", back_populates="submitter")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(220), unique=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)

    submissions = relationship("ResearchSubmission", back_populates="course")


class ResearchSubmission(Base, TimestampMixin):
    __tablename__ = "research_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    submission_type: Mapped[str] = mapped_column(String(40), default="research", index=True)
    title: Mapped[str] = mapped_column(String(260), index=True)
    authors: Mapped[str] = mapped_column(String(260))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    section: Mapped[str] = mapped_column(String(40))
    adviser: Mapped[str] = mapped_column(String(160), index=True)
    school_year: Mapped[str] = mapped_column(String(20), index=True)
    submission_year: Mapped[int] = mapped_column(Integer, index=True)
    keywords: Mapped[str] = mapped_column(String(360))
    abstract: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Enum(*SUBMISSION_VALUES, name="submission_enum"), default="Pending Review")
    file_path: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(260))
    file_type: Mapped[str] = mapped_column(String(20))
    mime_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    submitter_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    submitter = relationship("User", back_populates="submissions")
    course = relationship("Course", back_populates="submissions")
    format_check = relationship("FormatCheckResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    remarks = relationship("ReviewRemark", back_populates="submission", cascade="all, delete-orphan")


class AccomplishmentReport(Base, TimestampMixin):
    __tablename__ = "accomplishment_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_submission_id: Mapped[Optional[int]] = mapped_column(ForeignKey("research_submissions.id", ondelete="SET NULL"), nullable=True, unique=True)
    report_type: Mapped[str] = mapped_column(Enum(*ACCOMPLISHMENT_VALUES, name="accomplishment_enum"), index=True)
    title: Mapped[str] = mapped_column(String(260), index=True)
    researcher: Mapped[str] = mapped_column(String(260))
    category: Mapped[str] = mapped_column(String(120))
    organization: Mapped[str] = mapped_column(String(260))
    venue: Mapped[Optional[str]] = mapped_column(String(260), nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    event_date: Mapped[date] = mapped_column(Date, index=True)
    school_year: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(80), default="Pending")
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[Optional[str]] = mapped_column(String(260), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    owner_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    owner = relationship("User")


class FormatCheckResult(Base, TimestampMixin):
    __tablename__ = "format_check_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("research_submissions.id"), unique=True)
    is_compliant: Mapped[bool] = mapped_column(Boolean, default=False)
    warnings: Mapped[str] = mapped_column(Text, default="[]")
    passed_items: Mapped[str] = mapped_column(Text, default="[]")
    raw_summary: Mapped[str] = mapped_column(Text, default="{}")

    submission = relationship("ResearchSubmission", back_populates="format_check")


class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    instructions: Mapped[str] = mapped_column(Text)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[Optional[str]] = mapped_column(String(260), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    uploaded_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[Optional[str]] = mapped_column(String(260), nullable=True)


class ReviewRemark(Base, TimestampMixin):
    __tablename__ = "review_remarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("research_submissions.id"))
    reviewer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(Enum(*SUBMISSION_VALUES, name="remark_status_enum"))
    remarks: Mapped[str] = mapped_column(Text)

    submission = relationship("ResearchSubmission", back_populates="remarks")
    reviewer = relationship("User")
