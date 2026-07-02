# CTED Research Repository and Format Compliance System

## System Architecture

The application uses a React + Vite frontend, a FastAPI backend, SQLAlchemy ORM, a relational database, and Supabase Storage for uploaded research files and templates.

```text
Browser
  -> React/Vite/Tailwind frontend
  -> FastAPI REST API
  -> SQLAlchemy ORM
  -> SQLite locally, hosted PostgreSQL/MySQL in production
  -> Supabase Storage private bucket with signed URLs
```

## Current Organization Flow

Research is organized as:

```text
Program / Course
  -> School Year
      -> Research Submissions
```

Example:

```text
BSED English
  -> School Year 2025-2026
  -> School Year 2024-2025
```

Student class-level grouping has been removed from the active UI, API, and data model.

## Core Database Tables

### users

- `id`
- `full_name`
- `email`
- `password_hash`
- `role`: `admin`, `faculty`, `student`
- `account_status`: `pending`, `approved`, `rejected`, `deactivated`
- `is_active`
- `course_id`
- `section`
- `created_at`
- `updated_at`

### courses

Seeds the 9 CTED programs:

- BSED English
- BSED Mathematics
- BSED Science
- BSED Filipino
- BSED Social Studies
- BSED Culture and Arts
- BSED Physical Education
- BEED
- BECED

### research_submissions

- `id`
- `title`
- `authors`
- `course_id`
- `section`
- `adviser`
- `school_year`
- `submission_year`
- `keywords`
- `abstract`
- `status`
- `file_path`
- `original_filename`
- `file_type`
- `visible`
- `submitter_id`
- `created_at`
- `updated_at`

### format_check_results

Stores automatic DOCX/PDF format validation results.

### templates

Stores official research format/template files and formatting instructions.

### notifications

Stores account, upload, review, and format-check notifications.

### review_remarks

Stores admin approval, disapproval, and revision comments.

## Main API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Programs

- `GET /api/courses`
- `GET /api/dashboard/course-stats`
- `GET /api/programs/{program_id}/years`
- `GET /api/programs/{program_id}/years/{school_year}/researches`

### Submissions

- `POST /api/submissions`
- `GET /api/submissions`
- `GET /api/submissions/{id}/download`
- `POST /api/submissions/{id}/review`
- `PATCH /api/submissions/{id}/visibility`

Submission filters:

- `course_id`
- `status`
- `adviser`
- `school_year`
- `submission_year`
- `mine`

### Repository

- `GET /api/repository`

Repository filters:

- `search`
- `course_id`
- `school_year`
- `submission_year`

### Admin

- `GET /api/users`
- `PATCH /api/users/{id}`
- `DELETE /api/users/{id}`

### Templates And Notifications

- `GET /api/templates`
- `POST /api/templates`
- `GET /api/templates/{id}/download`
- `GET /api/notifications`
- `PATCH /api/notifications/{id}/read`

## Frontend Routes

- `/login`
- `/register`
- `/admin`
- `/programs/:programId/years`
- `/programs/:programId/years/:schoolYear/researches`
- `/upload`
- `/my-submissions`
- `/pending-reviews`
- `/repository`
- `/templates`
- `/users`
- `/notifications`
- `/reports`
- `/settings`

## Run Locally

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Default admin:

```text
Email: admin@cte.edu
Password: admin123
```
