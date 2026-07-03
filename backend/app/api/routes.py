import json
from datetime import date
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.api.deps import require_admin, require_approved
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.entities import AccomplishmentReport, Course, FormatCheckResult, Notification, ResearchSubmission, ReviewRemark, Template, User
from app.schemas.dto import AccomplishmentOut, CourseOut, DashboardStats, NotificationCountOut, NotificationOut, ProgramYearOut, ReportSummary, ReportTrend, ReviewCreate, SearchResultOut, SearchResultsOut, SignedUrlOut, SubmissionOut, TemplateOut, Token, UserCreate, UserOut
from app.services.format_checker import check_document, serialize_check
from app.services.notifications import notify, notify_admins
from app.core.config import get_settings
from app.services.storage import delete_file, signed_url, store_profile_image, store_upload

router = APIRouter(prefix="/api")


def _submission_query(db: Session):
    return db.query(ResearchSubmission).options(
        joinedload(ResearchSubmission.submitter),
        joinedload(ResearchSubmission.course),
        joinedload(ResearchSubmission.format_check),
    )


def _submission_out(item: ResearchSubmission) -> SubmissionOut:
    return SubmissionOut.model_validate(item)


def _accomplishment_query(db: Session):
    return db.query(AccomplishmentReport).options(joinedload(AccomplishmentReport.owner))


def _ensure_report_access(item: AccomplishmentReport, user: User, write: bool = False) -> None:
    if user.role == "admin":
        return
    if item.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You can only access your own records.")
    if write and item.status != "Pending":
        raise HTTPException(status_code=403, detail="Only pending records can be changed.")


def _submission_search_match(needle: str):
    return or_(
        ResearchSubmission.title.ilike(needle),
        ResearchSubmission.authors.ilike(needle),
        ResearchSubmission.adviser.ilike(needle),
        ResearchSubmission.keywords.ilike(needle),
        ResearchSubmission.abstract.ilike(needle),
        ResearchSubmission.school_year.ilike(needle),
        ResearchSubmission.course.has(or_(Course.name.ilike(needle), Course.code.ilike(needle))),
    )


def _accomplishment_search_match(needle: str):
    return or_(
        AccomplishmentReport.title.ilike(needle),
        AccomplishmentReport.researcher.ilike(needle),
        AccomplishmentReport.organization.ilike(needle),
        AccomplishmentReport.school_year.ilike(needle),
        AccomplishmentReport.category.ilike(needle),
        AccomplishmentReport.venue.ilike(needle),
    )


def _submission_view_url(item: ResearchSubmission, user: User) -> str:
    if user.role == "admin" and item.status != "Approved":
        return "/pending-reviews"
    if item.submitter_id == user.id:
        return "/my-submissions"
    return "/repository"


def _search_result(id: int, title: str, type: str, author: str, school_year: str, status: str, view_url: str) -> SearchResultOut:
    return SearchResultOut(
        id=id,
        title=title,
        type=type,
        author=author,
        school_year=school_year,
        status=status,
        view_url=view_url,
    )


def _user_out(user: User) -> UserOut:
    avatar_url = None
    if user.profile_image_path:
        try:
            avatar_url = signed_url(
                user.profile_image_path,
                expires_in=3600,
                bucket=get_settings().supabase_profile_images_bucket,
            )
        except HTTPException:
            avatar_url = None
    data = UserOut.model_validate(user).model_dump()
    data["avatar_url"] = avatar_url
    return UserOut(**data)


@router.post("/auth/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(func.lower(User.email) == payload.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email is already registered.")
    user = User(**payload.model_dump(exclude={"password"}), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    notify_admins(db, "New account registration", f"{user.full_name} registered as {user.role}.", "/users")
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post("/auth/login", response_model=Token)
def login(email: str = Form(), password: str = Form(), db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active or user.account_status != "approved":
        raise HTTPException(status_code=403, detail="Account is not approved or active.")
    return Token(access_token=create_access_token(str(user.id)), user=_user_out(user))


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(require_approved)):
    return _user_out(user)


@router.get("/courses", response_model=list[CourseOut])
def courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.name).all()


@router.get("/dashboard/course-stats", response_model=list[DashboardStats])
def course_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    courses = db.query(Course).order_by(Course.name).all()
    output = []
    for course in courses:
        rows = db.query(ResearchSubmission.status, func.count(ResearchSubmission.id)).filter(
            ResearchSubmission.course_id == course.id
        ).group_by(ResearchSubmission.status).all()
        counts = dict(rows)
        output.append(DashboardStats(
            course_id=course.id,
            course_name=course.name,
            total=sum(counts.values()),
            pending=counts.get("Pending Review", 0),
            approved=counts.get("Approved", 0),
            disapproved=counts.get("Disapproved", 0),
            needs_revision=counts.get("Needs Revision", 0),
        ))
    return output


@router.get("/dashboard/report-summary", response_model=ReportSummary)
def report_summary(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(AccomplishmentReport.report_type, func.count(AccomplishmentReport.id)).group_by(AccomplishmentReport.report_type).all()
    counts = dict(rows)
    return ReportSummary(
        presentations=counts.get("presentation", 0),
        publications=counts.get("publication", 0),
        utilizations=counts.get("utilization", 0),
    )


@router.get("/reports/trends", response_model=list[ReportTrend])
def report_trends(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(
        AccomplishmentReport.school_year,
        AccomplishmentReport.report_type,
        func.count(AccomplishmentReport.id),
    ).group_by(AccomplishmentReport.school_year, AccomplishmentReport.report_type).all()
    grouped: dict[str, dict[str, int]] = {}
    for school_year, report_type, count in rows:
        grouped.setdefault(school_year, {})
        grouped[school_year][report_type] = count
    return [
        ReportTrend(
            school_year=school_year,
            presentations=counts.get("presentation", 0),
            publications=counts.get("publication", 0),
            utilizations=counts.get("utilization", 0),
        )
        for school_year, counts in sorted(grouped.items())
    ]


@router.get("/search", response_model=SearchResultsOut)
def search(q: str = "", db: Session = Depends(get_db), user: User = Depends(require_approved)):
    term = q.strip()
    empty = SearchResultsOut(research_submissions=[], presentations=[], publications=[], utilizations=[])
    if not term:
        return empty

    needle = f"%{term}%"
    submissions = _submission_query(db).filter(_submission_search_match(needle))
    if user.role != "admin":
        submissions = submissions.filter(ResearchSubmission.submitter_id == user.id)

    accomplishments = _accomplishment_query(db).filter(_accomplishment_search_match(needle))
    if user.role != "admin":
        accomplishments = accomplishments.filter(AccomplishmentReport.owner_id == user.id)

    grouped = {
        "research_submissions": [
            _search_result(
                item.id,
                item.title,
                "Research Submission",
                item.authors,
                item.school_year,
                item.status,
                _submission_view_url(item, user),
            )
            for item in submissions.order_by(ResearchSubmission.created_at.desc()).limit(30).all()
        ],
        "presentations": [],
        "publications": [],
        "utilizations": [],
    }

    for item in accomplishments.order_by(AccomplishmentReport.created_at.desc()).limit(90).all():
        key = f"{item.report_type}s"
        grouped[key].append(_search_result(
            item.id,
            item.title,
            item.report_type.title(),
            item.researcher,
            item.school_year,
            item.status,
            f"/accomplishment-reports/{item.report_type}",
        ))

    return SearchResultsOut(**grouped)


@router.post("/submissions", response_model=SubmissionOut)
def upload_submission(
    title: str = Form(),
    authors: str = Form(),
    course_id: int = Form(),
    section: str = Form(""),
    adviser: str = Form(),
    school_year: str = Form(),
    submission_year: int = Form(),
    keywords: str = Form(),
    abstract: str = Form(),
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    stored = store_upload(file, "research", {".docx", ".pdf"})
    submission = ResearchSubmission(
        title=title,
        authors=authors,
        course_id=course_id,
        section=section,
        adviser=adviser,
        school_year=school_year,
        submission_year=submission_year,
        keywords=keywords,
        abstract=abstract,
        file_path=stored.storage_key,
        original_filename=stored.original_filename,
        file_type=stored.file_type,
        mime_type=stored.mime_type,
        file_size=stored.file_size,
        submitter_id=user.id,
    )
    db.add(submission)
    db.flush()
    try:
        result = check_document(stored.temp_path)
        compliant, warnings, passed, raw = serialize_check(result)
    finally:
        Path(stored.temp_path).unlink(missing_ok=True)
    db.add(FormatCheckResult(submission_id=submission.id, is_compliant=compliant, warnings=warnings, passed_items=passed, raw_summary=raw))
    notify(db, user.id, "Submission received", f"Your research '{title}' was submitted for review.", "/my-submissions")
    if not compliant:
        notify(db, user.id, "Format warning detected", "Review the format warnings saved with your submission.", "/my-submissions")
    notify_admins(db, "New research uploaded", f"{user.full_name} uploaded '{title}'.", "/pending-reviews")
    db.commit()
    return _submission_out(_submission_query(db).filter(ResearchSubmission.id == submission.id).first())


@router.get("/submissions", response_model=list[SubmissionOut])
def list_submissions(
    course_id: int | None = None,
    status: str | None = None,
    adviser: str | None = None,
    school_year: str | None = None,
    submission_year: int | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    query = _submission_query(db)
    if user.role != "admin" or mine:
        query = query.filter(ResearchSubmission.submitter_id == user.id)
    if course_id:
        query = query.filter(ResearchSubmission.course_id == course_id)
    if status:
        query = query.filter(ResearchSubmission.status == status)
    if adviser:
        query = query.filter(ResearchSubmission.adviser.ilike(f"%{adviser}%"))
    if school_year:
        query = query.filter(ResearchSubmission.school_year == school_year)
    if submission_year:
        query = query.filter(ResearchSubmission.submission_year == submission_year)
    return [_submission_out(item) for item in query.order_by(ResearchSubmission.created_at.desc()).all()]


@router.get("/repository", response_model=list[SubmissionOut])
def repository(
    search: str | None = None,
    course_id: int | None = None,
    school_year: str | None = None,
    submission_year: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    query = _submission_query(db)
    if user.role == "admin":
        query = query.filter(ResearchSubmission.status == "Approved", ResearchSubmission.visible.is_(True))
    else:
        query = query.filter(ResearchSubmission.submitter_id == user.id)
    if search:
        needle = f"%{search}%"
        query = query.filter(or_(
            ResearchSubmission.title.ilike(needle),
            ResearchSubmission.authors.ilike(needle),
            ResearchSubmission.keywords.ilike(needle),
            ResearchSubmission.school_year.ilike(needle),
            ResearchSubmission.adviser.ilike(needle),
        ))
    if course_id:
        query = query.filter(ResearchSubmission.course_id == course_id)
    if school_year:
        query = query.filter(ResearchSubmission.school_year == school_year)
    if submission_year:
        query = query.filter(ResearchSubmission.submission_year == submission_year)
    return [_submission_out(item) for item in query.order_by(ResearchSubmission.title).all()]


@router.get("/programs/{program_id}/years", response_model=list[ProgramYearOut])
def program_years(program_id: int, db: Session = Depends(get_db), _: User = Depends(require_approved)):
    rows = db.query(
        ResearchSubmission.school_year,
        ResearchSubmission.submission_year,
        ResearchSubmission.status,
        func.count(ResearchSubmission.id),
    ).filter(ResearchSubmission.course_id == program_id).group_by(
        ResearchSubmission.school_year,
        ResearchSubmission.submission_year,
        ResearchSubmission.status,
    ).all()
    grouped: dict[tuple[str, int], dict[str, int]] = {}
    for school_year, submission_year, status, count in rows:
        grouped.setdefault((school_year, submission_year), {})
        grouped[(school_year, submission_year)][status] = count
    output = []
    for (school_year, submission_year), counts in grouped.items():
        output.append(ProgramYearOut(
            course_id=program_id,
            school_year=school_year,
            submission_year=submission_year,
            total=sum(counts.values()),
            pending=counts.get("Pending Review", 0),
            approved=counts.get("Approved", 0),
            disapproved=counts.get("Disapproved", 0),
            needs_revision=counts.get("Needs Revision", 0),
        ))
    return sorted(output, key=lambda item: (item.submission_year, item.school_year), reverse=True)


@router.get("/programs/{program_id}/years/{school_year}/researches", response_model=list[SubmissionOut])
def program_year_researches(program_id: int, school_year: str, db: Session = Depends(get_db), _: User = Depends(require_approved)):
    decoded_school_year = school_year.replace("_", "-")
    query = _submission_query(db).filter(
        ResearchSubmission.course_id == program_id,
        ResearchSubmission.school_year == decoded_school_year,
    )
    return [_submission_out(item) for item in query.order_by(ResearchSubmission.created_at.desc()).all()]


@router.post("/submissions/{submission_id}/review", response_model=SubmissionOut)
def review_submission(submission_id: int, payload: ReviewCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    submission = db.get(ResearchSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    submission.status = payload.status
    db.add(ReviewRemark(submission_id=submission.id, reviewer_id=admin.id, status=payload.status, remarks=payload.remarks))
    if submission.submitter_id:
        notify(db, submission.submitter_id, f"Research {payload.status}", payload.remarks, "/my-submissions")
    db.commit()
    return _submission_out(_submission_query(db).filter(ResearchSubmission.id == submission.id).first())


@router.patch("/submissions/{submission_id}/visibility", response_model=SubmissionOut)
def update_visibility(submission_id: int, visible: bool = Form(), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    submission = db.get(ResearchSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    submission.visible = visible
    db.commit()
    return _submission_out(_submission_query(db).filter(ResearchSubmission.id == submission.id).first())


@router.get("/submissions/{submission_id}/download", response_model=SignedUrlOut)
def download_submission(submission_id: int, db: Session = Depends(get_db), user: User = Depends(require_approved)):
    submission = db.get(ResearchSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if user.role != "admin" and submission.submitter_id != user.id and submission.status != "Approved":
        raise HTTPException(status_code=403, detail="You cannot access this file.")
    return SignedUrlOut(url=signed_url(submission.file_path), expires_in=300)


@router.patch("/submissions/{submission_id}", response_model=SubmissionOut)
def update_submission(
    submission_id: int,
    title: str = Form(),
    authors: str = Form(),
    course_id: int = Form(),
    section: str = Form(""),
    adviser: str = Form(),
    school_year: str = Form(),
    submission_year: int = Form(),
    keywords: str = Form(),
    abstract: str = Form(),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    submission = db.get(ResearchSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    if user.role != "admin":
        if submission.submitter_id != user.id:
            raise HTTPException(status_code=403, detail="You can only edit your own submissions.")
        if submission.status not in {"Pending Review", "Needs Revision"}:
            raise HTTPException(status_code=403, detail="Only pending or needs revision submissions can be edited.")
    submission.title = title
    submission.authors = authors
    submission.course_id = course_id
    submission.section = section
    submission.adviser = adviser
    submission.school_year = school_year
    submission.submission_year = submission_year
    submission.keywords = keywords
    submission.abstract = abstract
    if file:
        old_key = submission.file_path
        stored = store_upload(file, "research", {".docx", ".pdf"})
        submission.file_path = stored.storage_key
        submission.original_filename = stored.original_filename
        submission.file_type = stored.file_type
        submission.mime_type = stored.mime_type
        submission.file_size = stored.file_size
        try:
            result = check_document(stored.temp_path)
            compliant, warnings, passed, raw = serialize_check(result)
        finally:
            Path(stored.temp_path).unlink(missing_ok=True)
        delete_file(old_key)
        if submission.format_check:
            submission.format_check.is_compliant = compliant
            submission.format_check.warnings = warnings
            submission.format_check.passed_items = passed
            submission.format_check.raw_summary = raw
        else:
            db.add(FormatCheckResult(submission_id=submission.id, is_compliant=compliant, warnings=warnings, passed_items=passed, raw_summary=raw))
    db.commit()
    return _submission_out(_submission_query(db).filter(ResearchSubmission.id == submission.id).first())


@router.get("/accomplishments", response_model=list[AccomplishmentOut])
def list_accomplishments(report_type: str | None = None, mine: bool = False, db: Session = Depends(get_db), user: User = Depends(require_approved)):
    query = _accomplishment_query(db)
    if report_type:
        query = query.filter(AccomplishmentReport.report_type == report_type)
    if user.role != "admin" or mine:
        query = query.filter(AccomplishmentReport.owner_id == user.id)
    return [AccomplishmentOut.model_validate(item) for item in query.order_by(AccomplishmentReport.created_at.desc()).all()]


@router.post("/accomplishments", response_model=AccomplishmentOut)
def create_accomplishment(
    report_type: str = Form(),
    title: str = Form(),
    researcher: str = Form(),
    category: str = Form(),
    organization: str = Form(),
    event_date: date = Form(),
    school_year: str = Form(),
    status: str = Form("Pending"),
    venue: str | None = Form(None),
    link: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    if report_type not in {"presentation", "publication", "utilization"}:
        raise HTTPException(status_code=400, detail="Invalid report type.")
    path = filename = None
    mime_type = file_size = None
    if file:
        stored = store_upload(file, "accomplishments", {".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"})
        path = stored.storage_key
        filename = stored.original_filename
        mime_type = stored.mime_type
        file_size = stored.file_size
        Path(stored.temp_path).unlink(missing_ok=True)
    item = AccomplishmentReport(
        report_type=report_type,
        title=title,
        researcher=researcher,
        category=category,
        organization=organization,
        venue=venue,
        link=link,
        event_date=event_date,
        school_year=school_year,
        status=status,
        file_path=path,
        original_filename=filename,
        mime_type=mime_type,
        file_size=file_size,
        owner_id=user.id,
    )
    db.add(item)
    db.commit()
    return AccomplishmentOut.model_validate(_accomplishment_query(db).filter(AccomplishmentReport.id == item.id).first())


@router.patch("/accomplishments/{report_id}", response_model=AccomplishmentOut)
def update_accomplishment(
    report_id: int,
    title: str = Form(),
    researcher: str = Form(),
    category: str = Form(),
    organization: str = Form(),
    event_date: date = Form(),
    school_year: str = Form(),
    status: str = Form("Pending"),
    venue: str | None = Form(None),
    link: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    item = db.get(AccomplishmentReport, report_id)
    if not item:
        raise HTTPException(status_code=404, detail="Record not found.")
    _ensure_report_access(item, user, write=True)
    if file:
        old_key = item.file_path
        stored = store_upload(file, "accomplishments", {".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"})
        item.file_path = stored.storage_key
        item.original_filename = stored.original_filename
        item.mime_type = stored.mime_type
        item.file_size = stored.file_size
        Path(stored.temp_path).unlink(missing_ok=True)
        delete_file(old_key)
    item.title = title
    item.researcher = researcher
    item.category = category
    item.organization = organization
    item.venue = venue
    item.link = link
    item.event_date = event_date
    item.school_year = school_year
    item.status = status
    db.commit()
    return AccomplishmentOut.model_validate(_accomplishment_query(db).filter(AccomplishmentReport.id == item.id).first())


@router.delete("/accomplishments/{report_id}")
def delete_accomplishment(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_approved)):
    item = db.get(AccomplishmentReport, report_id)
    if not item:
        raise HTTPException(status_code=404, detail="Record not found.")
    _ensure_report_access(item, user, write=True)
    delete_file(item.file_path)
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/accomplishments/{report_id}/download", response_model=SignedUrlOut)
def download_accomplishment(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_approved)):
    item = db.get(AccomplishmentReport, report_id)
    if not item or not item.file_path:
        raise HTTPException(status_code=404, detail="File not found.")
    _ensure_report_access(item, user)
    return SignedUrlOut(url=signed_url(item.file_path), expires_in=300)


@router.get("/templates", response_model=list[TemplateOut])
def templates(db: Session = Depends(get_db)):
    return db.query(Template).order_by(Template.created_at.desc()).all()


@router.post("/templates", response_model=TemplateOut)
def create_template(title: str = Form(), instructions: str = Form(), file: UploadFile | None = File(None), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    path = filename = None
    mime_type = file_size = None
    if file:
        stored = store_upload(file, "templates", {".docx", ".pdf"})
        path = stored.storage_key
        filename = stored.original_filename
        mime_type = stored.mime_type
        file_size = stored.file_size
        Path(stored.temp_path).unlink(missing_ok=True)
    template = Template(title=title, instructions=instructions, file_path=path, original_filename=filename, mime_type=mime_type, file_size=file_size, uploaded_by_id=admin.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates/{template_id}/download", response_model=SignedUrlOut)
def download_template(template_id: int, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template or not template.file_path:
        raise HTTPException(status_code=404, detail="Template file not found.")
    return SignedUrlOut(url=signed_url(template.file_path), expires_in=300)


@router.get("/users/me", response_model=UserOut)
def get_my_user(user: User = Depends(require_approved)):
    return _user_out(user)


@router.patch("/users/me", response_model=UserOut)
def update_my_user(
    full_name: str | None = Form(None),
    email: str | None = Form(None),
    section: str | None = Form(None),
    course_id: int | None = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    if full_name is not None and full_name.strip():
        user.full_name = full_name.strip()
    if email is not None and email.strip():
        normalized_email = email.strip().lower()
        existing = db.query(User).filter(func.lower(User.email) == normalized_email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email is already registered.")
        user.email = normalized_email
    if section is not None:
        user.section = section.strip() or None
    if course_id is not None:
        user.course_id = course_id
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post("/users/me/profile-image", response_model=UserOut)
def upload_my_profile_image(
    file: UploadFile = File(),
    db: Session = Depends(get_db),
    user: User = Depends(require_approved),
):
    old_path = user.profile_image_path
    storage_key = store_profile_image(file, user.id)
    user.profile_image_path = storage_key
    db.commit()
    db.refresh(user)
    if old_path and old_path != storage_key:
        delete_file(old_path, bucket=get_settings().supabase_profile_images_bucket)
    return _user_out(user)


@router.get("/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [_user_out(user) for user in db.query(User).order_by(User.created_at.desc()).all()]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, account_status: str | None = Form(None), is_active: bool | None = Form(None), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if account_status:
        user.account_status = account_status
        notify(db, user.id, "Account status updated", f"Your account is now {account_status}.")
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account while logged in.")
    if user.role == "admin":
        admin_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="You cannot delete the last remaining admin account.")

    profile_image_path = user.profile_image_path
    try:
        db.query(ResearchSubmission).filter(ResearchSubmission.submitter_id == user.id).update(
            {ResearchSubmission.submitter_id: None},
            synchronize_session=False,
        )
        db.query(AccomplishmentReport).filter(AccomplishmentReport.owner_id == user.id).update(
            {AccomplishmentReport.owner_id: None},
            synchronize_session=False,
        )
        db.query(ReviewRemark).filter(ReviewRemark.reviewer_id == user.id).update(
            {ReviewRemark.reviewer_id: None},
            synchronize_session=False,
        )
        db.query(Template).filter(Template.uploaded_by_id == user.id).update(
            {Template.uploaded_by_id: None},
            synchronize_session=False,
        )
        db.query(Notification).filter(Notification.user_id == user.id).update(
            {Notification.user_id: None},
            synchronize_session=False,
        )
        db.delete(user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="This user account could not be deleted because one or more related records could not be archived safely.") from exc
    if profile_image_path:
        delete_file(profile_image_path, bucket=get_settings().supabase_profile_images_bucket)
    return {"ok": True}


@router.get("/notifications", response_model=list[NotificationOut])
def notifications(db: Session = Depends(get_db), user: User = Depends(require_approved)):
    return db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).all()


@router.get("/notifications/unread-count", response_model=NotificationCountOut)
def unread_notifications(db: Session = Depends(get_db), user: User = Depends(require_approved)):
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user.id,
        Notification.is_read.is_(False),
    ).scalar()
    return NotificationCountOut(unread_count=count or 0)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationOut)
def read_notification(notification_id: int, db: Session = Depends(get_db), user: User = Depends(require_approved)):
    item = db.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification not found.")
    item.is_read = True
    db.commit()
    return item
