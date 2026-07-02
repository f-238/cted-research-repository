from datetime import date, datetime
import json
from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = Field(pattern="^(faculty|student)$")
    course_id: int | None = None
    section: str | None = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    account_status: str
    is_active: bool
    course_id: int | None
    section: str | None

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class FormatCheckOut(BaseModel):
    id: int
    is_compliant: bool
    warnings: list[str]
    passed_items: list[str]

    @field_validator("warnings", "passed_items", mode="before")
    @classmethod
    def parse_json_list(cls, value):
        if isinstance(value, str):
            return json.loads(value)
        return value

    class Config:
        from_attributes = True


class SubmissionOut(BaseModel):
    id: int
    title: str
    authors: str
    section: str
    adviser: str
    school_year: str
    submission_year: int
    keywords: str
    abstract: str
    status: str
    visible: bool
    original_filename: str
    file_type: str
    mime_type: str | None = None
    file_size: int | None = None
    created_at: datetime
    submitter: UserOut
    course: CourseOut
    format_check: FormatCheckOut | None = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    status: str = Field(pattern="^(Approved|Disapproved|Needs Revision|Pending Review)$")
    remarks: str = Field(min_length=1)


class TemplateOut(BaseModel):
    id: int
    title: str
    instructions: str
    original_filename: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    link: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    course_id: int
    course_name: str
    total: int
    pending: int
    approved: int
    disapproved: int
    needs_revision: int


class ProgramYearOut(BaseModel):
    course_id: int
    school_year: str
    submission_year: int
    total: int
    pending: int
    approved: int
    disapproved: int
    needs_revision: int


class AccomplishmentOut(BaseModel):
    id: int
    report_type: str
    title: str
    researcher: str
    category: str
    organization: str
    venue: str | None
    link: str | None
    event_date: date
    school_year: str
    status: str
    original_filename: str | None
    mime_type: str | None = None
    file_size: int | None = None
    created_at: datetime
    owner: UserOut

    class Config:
        from_attributes = True


class ReportSummary(BaseModel):
    presentations: int
    publications: int
    utilizations: int


class ReportTrend(BaseModel):
    school_year: str
    presentations: int
    publications: int
    utilizations: int


class SignedUrlOut(BaseModel):
    url: str
    expires_in: int
