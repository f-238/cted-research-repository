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
    profile_image_path: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class CourseOut(BaseModel):
    id: int
    name: str
    code: str
    department: str | None = None
    status: str = "Active"
    display_order: int = 0

    class Config:
        from_attributes = True


class ProgramCreate(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=2, max_length=220)
    department: str | None = None
    status: str = "Active"
    display_order: int = 0


class ProgramUpdate(ProgramCreate):
    pass


class ProgramOrderItem(BaseModel):
    id: int
    display_order: int


class ProgramOrderUpdate(BaseModel):
    programs: list[ProgramOrderItem]


class SystemSettingsPayload(BaseModel):
    settings: dict


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
    submission_type: str = "research"
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
    latest_remark: str | None = None
    submitter: UserOut | None = None
    course: CourseOut
    format_check: FormatCheckOut | None = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    status: str = Field(pattern="^(Approved|Disapproved|Needs Revision|Pending Review)$")
    remarks: str = Field(min_length=1)


class NotificationBulkAction(BaseModel):
    notification_ids: list[int]


class NotificationBulkReadAction(NotificationBulkAction):
    is_read: bool


class ResearchBulkDelete(BaseModel):
    research_ids: list[int]


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


class NotificationCountOut(BaseModel):
    unread_count: int


class SearchResultOut(BaseModel):
    id: int
    title: str
    type: str
    author: str
    school_year: str
    status: str
    view_url: str


class SearchResultsOut(BaseModel):
    research_submissions: list[SearchResultOut]
    presentations: list[SearchResultOut]
    publications: list[SearchResultOut]
    utilizations: list[SearchResultOut]


class FacultyResearchItemOut(BaseModel):
    id: int
    title: str
    type: str
    school_year: str
    date: str
    status: str
    download_url: str | None = None
    latest_remark: str | None = None
    submission_type: str | None = None
    authors: str | None = None
    adviser: str | None = None
    course_id: int | None = None
    course_name: str | None = None
    section: str | None = None
    submission_year: int | None = None
    keywords: str | None = None
    abstract: str | None = None
    can_edit: bool = False


class FacultyResearchResultsOut(BaseModel):
    research_submissions: list[FacultyResearchItemOut]
    presentations: list[FacultyResearchItemOut]
    publications: list[FacultyResearchItemOut]
    utilizations: list[FacultyResearchItemOut]
    completed_papers: list[FacultyResearchItemOut]


class FacultyAccomplishmentSummaryOut(BaseModel):
    researches: int
    presentations: int
    publications: int
    utilizations: int
    completed_papers: int


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
    owner: UserOut | None = None

    class Config:
        from_attributes = True


class CompletedPaperOut(BaseModel):
    id: int
    title: str
    authors: str
    adviser: str
    program_id: int
    program: CourseOut
    school_year: str
    submission_year: int
    completion_date: date
    abstract: str
    keywords: str
    remarks: str | None = None
    status: str
    original_filename: str | None
    mime_type: str | None = None
    file_size: int | None = None
    owner: UserOut | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class ReportSummary(BaseModel):
    presentations: int
    publications: int
    utilizations: int
    completed_papers: int


class ReportTrend(BaseModel):
    school_year: str
    presentations: int
    publications: int
    utilizations: int
    completed_papers: int


class SignedUrlOut(BaseModel):
    url: str
    expires_in: int
