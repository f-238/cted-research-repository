# Supabase Storage Local Testing

## 1. Create The Bucket

1. Open https://supabase.com/dashboard.
2. Select your project.
3. Go to `Storage`.
4. Click `New bucket`.
5. Set the bucket name to:

```text
research-files
```

6. Keep `Public bucket` turned off. The bucket must be private.
7. Click `Create bucket`.

## 2. Get Supabase Values

In your Supabase project dashboard:

- `SUPABASE_URL`: go to `Project Settings -> API -> Project URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: go to `Project Settings -> API -> Project API keys -> service_role`.
- `SUPABASE_BUCKET`: use `research-files`.

Keep the service role key server-side only. Do not add it to Vercel or frontend `.env` files.

## 3. Backend Environment File

The backend environment file is:

```text
backend/.env
```

For local testing, copy:

```powershell
Copy-Item backend\.env.example backend\.env
```

Then fill in:

```env
DATABASE_URL=sqlite:///./cte_repository.db
JWT_SECRET=replace-with-a-local-random-secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=research-files
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
ADMIN_EMAIL=admin@cte.edu
ADMIN_PASSWORD=admin123
MAX_UPLOAD_SIZE_MB=20
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

## 4. Frontend Environment File

For local frontend testing, create:

```text
frontend/.env
```

Use:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## 5. Local Run Commands

Backend install:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Backend dev server:

```powershell
cd backend
..\.venv\Scripts\python.exe -m app.cli init
..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend install:

```powershell
cd frontend
npm install
```

Frontend dev server:

```powershell
cd frontend
npm run dev
```

## 6. Upload And Download Test Checklist

- Log in as the admin account from `ADMIN_EMAIL`.
- Register and approve a test student/faculty account.
- Log in as the approved test user.
- Upload a PDF research file.
- Upload a DOCX research file.
- Confirm both objects appear in Supabase `Storage -> research-files -> research`.
- Confirm the database row saves:
  - `original_filename`
  - `file_path` as the Supabase storage key
  - `mime_type`
  - `file_size`
- Click Download/View from repository, pending reviews, or my submissions.
- Confirm the backend returns a signed URL and the browser opens the file.
- Upload an unsupported file type, such as `.exe`; confirm it is rejected.
- Upload a file larger than `MAX_UPLOAD_SIZE_MB`; confirm it is rejected.
- Restart the backend and confirm previously uploaded files still download.

## 7. Git Push Preparation

Run:

```powershell
git status
git add .
git commit -m "Prepare Supabase storage for deployment"
git push
```

Before pushing, confirm these are not staged:

- `backend/.env`
- `backend/cte_repository.db`
- `backend/uploads/`
- `frontend/node_modules/`
- `frontend/dist/`
- `frontend/.env`
- `frontend/vite-dev.log`
