# CTED Research Repository Production Deployment

This guide deploys the frontend and backend separately with a hosted database and persistent upload storage. The production app must not use localhost URLs.

## Production Architecture

```text
Public browser/mobile device
  -> Vercel or Netlify frontend
  -> Render/Railway/Fly.io backend API
  -> Hosted PostgreSQL or MySQL database
  -> Supabase Storage private bucket
```

## Required Environment Variables

### Backend

```env
DATABASE_URL=postgresql+psycopg://postgres:[YOUR-DB-PASSWORD]@db.rjcxogdfmpwovjmewbrx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=https://your-frontend-url.com
MAX_UPLOAD_SIZE_MB=20
ADMIN_EMAIL=admin@cte.edu
ADMIN_PASSWORD=replace-with-a-secure-admin-password
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=research-files
```

For MySQL, use:

```env
DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE
```

### Frontend

```env
VITE_API_URL=https://your-backend-url.com
```

## A. Backend Deployment

Recommended platform: Render, Railway, or Fly.io.

Backend root directory:

```text
backend
```

Install command:

```bash
pip install -r requirements.txt
```

Migration and baseline seed command:

```bash
python -m app.cli init
```

Production start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

If your provider does not define `$PORT`, use the port required by that provider.

## B. Database

Use Supabase PostgreSQL. Do not use local SQLite or local MySQL for production.

After creating the database:

1. Open Supabase `Project Settings -> Database -> Connection string`.
2. Copy the URI connection string.
3. Convert it to a SQLAlchemy URL if needed:
   - Direct: `postgresql+psycopg://postgres:[YOUR-DB-PASSWORD]@db.rjcxogdfmpwovjmewbrx.supabase.co:5432/postgres?sslmode=require`
   - Session pooler: `postgresql+psycopg://postgres.rjcxogdfmpwovjmewbrx:[YOUR-DB-PASSWORD]@[POOLER-HOST]:5432/postgres?sslmode=require`
4. Set it as `DATABASE_URL` on the backend service.
5. Run:

```bash
python -m app.cli init
```

This creates tables and seeds only:

- Default admin account
- CTED program list
- System template/settings record

It does not seed research submissions, accomplishment reports, charts, or fake records.

## C. Frontend Deployment

Recommended platform: Vercel or Netlify.

Frontend root directory:

```text
frontend
```

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Set this frontend environment variable before building:

```env
VITE_API_URL=https://your-backend-url.com
```

## D. CORS

After the frontend is deployed, copy its public URL and set it on the backend:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-url.com
```

If you deploy multiple frontend domains, separate them with commas:

```env
CORS_ALLOWED_ORIGINS=https://your-site.vercel.app,https://www.yourdomain.edu
```

Restart the backend after changing CORS settings.

## E. File Upload Storage

Uploaded PDF/DOCX files are stored in a private Supabase Storage bucket. The backend returns short-lived signed URLs for secure download and preview.

Create a Supabase Storage bucket:

```text
Bucket name: research-files
Public: false
```

Set these backend variables on Render:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=research-files
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in Vercel or frontend code.

## F. Final Public URL Testing

After backend, database, storage, and frontend are deployed:

1. Open the frontend public URL from another device using mobile data or a different network.
2. Register a student or faculty account.
3. Log in as the admin account from `ADMIN_EMAIL`.
4. Approve the new account.
5. Log in as the approved user.
6. Upload a PDF or DOCX research document.
7. Confirm the upload appears under admin Pending Reviews.
8. Download the uploaded file from admin review.
9. Approve, disapprove, or mark the submission as Needs Revision.
10. Confirm the user receives the notification.
11. Add Presentation, Publication, and Utilization records.
12. Open Reports Dashboard and confirm counts/charts appear only from real records.
13. Log out and log back in.
14. Restart the backend service and confirm uploaded files still download.

## Build Commands Summary

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m app.cli init
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Production Notes

- Keep `JWT_SECRET` private and use a long random value.
- Change `ADMIN_PASSWORD` before first production launch.
- Use HTTPS URLs for both frontend and backend.
- Keep `VITE_API_URL` pointed at the backend public URL, not localhost.
- Keep `CORS_ALLOWED_ORIGINS` pointed at the frontend public URL, not localhost.
- Dashboard and chart data are database-driven and remain empty until real users create records.
