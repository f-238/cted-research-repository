# Supabase PostgreSQL Backend Deployment

This backend is configured to use Supabase PostgreSQL through SQLAlchemy and `psycopg`.

## 1. Get The Supabase PostgreSQL URL

In Supabase:

1. Open your project.
2. Go to `Project Settings -> Database`.
3. Open `Connection string` or `Connect`.
4. Copy the URI connection string.
5. Use the database password you set for the project.

Recommended direct connection format:

```env
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-DB-PASSWORD]@db.rjcxogdfmpwovjmewbrx.supabase.co:5432/postgres?sslmode=require
```

If direct connection fails because your environment cannot reach Supabase direct IPv6/IPv4, use the Supabase `Session pooler` URI from the same Connect panel. Convert it to this SQLAlchemy form:

```env
DATABASE_URL=postgresql+psycopg://postgres.rjcxogdfmpwovjmewbrx:[YOUR-DB-PASSWORD]@[POOLER-HOST]:5432/postgres?sslmode=require
```

Use the exact pooler host shown by Supabase.

## 2. Backend Environment Variables

Set these in `backend/.env` for local production-like testing or in Render environment variables for production:

```env
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-DB-PASSWORD]@db.rjcxogdfmpwovjmewbrx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
SUPABASE_URL=https://rjcxogdfmpwovjmewbrx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=research-files
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN_EMAIL=admin@cte.edu
ADMIN_PASSWORD=replace-before-production
MAX_UPLOAD_SIZE_MB=20
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

Do not commit `backend/.env`.

## 3. Local Migration And Seed

From the project root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd backend
..\.venv\Scripts\python.exe -m app.cli init
```

This creates all tables in Supabase PostgreSQL and seeds only:

- Default admin account
- CTED program list
- System template/settings record

It does not seed research submissions, accomplishment reports, charts, reports, or fake records.

## 4. Local PostgreSQL Verification

Run:

```powershell
cd backend
@'
from app.core.database import SessionLocal
from app.models.entities import AccomplishmentReport, Course, Notification, ResearchSubmission, Template, User
with SessionLocal() as db:
    print({
        "users": db.query(User).count(),
        "approved_admins": db.query(User).filter(User.role == "admin", User.account_status == "approved").count(),
        "courses": db.query(Course).count(),
        "templates": db.query(Template).count(),
        "research_submissions": db.query(ResearchSubmission).count(),
        "accomplishment_reports": db.query(AccomplishmentReport).count(),
        "notifications": db.query(Notification).count(),
    })
'@ | ..\.venv\Scripts\python.exe -
```

Expected first-production baseline:

```text
users: 1
approved_admins: 1
courses: 9
templates: 1
research_submissions: 0
accomplishment_reports: 0
notifications: 0
```

## 5. Render Backend Settings

Render Web Service:

```text
Root Directory: backend
Runtime: Python
Build Command: pip install -r requirements.txt && python -m app.cli init
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Render environment variables:

```env
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-DB-PASSWORD]@db.rjcxogdfmpwovjmewbrx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=https://your-vercel-frontend-url.vercel.app
MAX_UPLOAD_SIZE_MB=20
ADMIN_EMAIL=admin@cte.edu
ADMIN_PASSWORD=replace-before-production
SUPABASE_URL=https://rjcxogdfmpwovjmewbrx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=research-files
```

## 6. Important Notes

- Supabase Storage remains configured separately with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`.
- `SUPABASE_SERVICE_ROLE_KEY` must be backend-only.
- Rotate any service role key that was pasted into chat or committed accidentally.
- The app uses `python -m app.cli init` for table creation and baseline seeding. Add Alembic later before making repeated schema changes in production.
