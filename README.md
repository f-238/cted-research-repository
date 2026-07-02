# CTE Research Repository and Format Compliance System

Full-stack first working version for a College of Teacher Education research repository.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy
- Dev database: SQLite by default; production database: Supabase PostgreSQL
- File storage: Supabase Storage bucket through signed URLs
- Document checking: DOCX via `python-docx`, limited PDF checks via `pypdf`

## Run locally

### Backend

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r backend\\requirements.txt
cd backend
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Seeded admin

- Email: `admin@cte.edu`
- Password: `admin123`

The database seeds all 9 CTED programs, a default template instruction record, and the admin account. Researches are organized by program and school year.

## Notes

- Student and faculty registrations are created as pending until approved by the admin.
- Uploaded DOCX/PDF files are stored in Supabase Storage and opened through signed URLs.
- DOCX format checks inspect required sections, font metadata, font size metadata, page size, margins, spacing, heading styles, and paragraph alignment where the document exposes that data.
- PDF validation intentionally warns that DOCX is recommended for accurate validation.

## Production deployment

Use [DEPLOYMENT.md](./DEPLOYMENT.md) for public deployment. Production must use:

- A public frontend URL with `VITE_API_URL` pointing to the backend.
- A public backend URL with `CORS_ALLOWED_ORIGINS` pointing to the frontend.
- A hosted PostgreSQL or MySQL database through `DATABASE_URL`.
- Supabase Storage through `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`.

For Supabase PostgreSQL migration and Render deployment, see [SUPABASE_POSTGRES_DEPLOYMENT.md](./SUPABASE_POSTGRES_DEPLOYMENT.md).
