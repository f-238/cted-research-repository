# Supabase RLS Audit

Audit date: 2026-08-20

## Architecture findings

- The React/Vite frontend uses only `fetch` through `frontend/src/lib/api.js`. It contains no Supabase SDK, direct PostgREST query, Supabase URL, anon key, publishable key, or service-role key.
- All application-table reads and writes go through FastAPI and SQLAlchemy. Registration, the public course list, and sanitized public settings are FastAPI endpoints, not direct database access.
- SQLAlchemy uses the backend-only `DATABASE_URL`. In the documented Supabase deployment it connects as the `postgres` database owner. The separate backend-only `SUPABASE_SERVICE_ROLE_KEY` is used solely by the Supabase Storage SDK.
- The checked-in frontend environment example contains only `VITE_API_URL`. The local frontend environment also defines only that variable. No secret or Supabase key is tracked by Git.
- The `research-files` and `profile-images` buckets are used only by FastAPI. Upload/delete operations use the backend service role; downloads use five-minute signed URLs (profile display URLs use one hour). Both buckets must be private.

## RLS decision

Enable RLS on every public application table and create **no** policies for `anon` or `authenticated`:

- `users`
- `research_submissions`
- `accomplishment_reports`
- `templates`
- `notifications`
- `format_check_results`
- `review_remarks`
- `completed_papers`
- `courses`
- `system_settings`

No table needs a browser-facing policy under the current server-only architecture. Even the data intentionally available before login (`courses` and a subset of `system_settings`) is filtered and returned by FastAPI. Adding SELECT policies for those tables would create a second, unnecessary public data path.

The migration deliberately does not use `FORCE ROW LEVEL SECURITY`. PostgreSQL table owners normally bypass RLS, so the documented owner `DATABASE_URL` continues to support SQLAlchemy. If production uses a custom non-owner role without `BYPASSRLS`, enabling RLS with no policies will block FastAPI; change the connection to the owner role or grant that dedicated backend role `BYPASSRLS` before applying the migration. Never give `BYPASSRLS` credentials to the frontend.

## API authorization review

- Admin-only: settings changes, program management, backups/exports, dashboard course statistics, pending-review details and decisions, research deletion/visibility, accomplishment CRUD, completed-paper CRUD, and user management.
- Faculty-only: faculty research and accomplishment views. Faculty/admin: aggregate reporting.
- Approved users: own submissions and revisions, repository/search subject to API filters, authorized downloads, profile operations, notifications, and templates.
- Public FastAPI endpoints: registration, login, active course choices, and sanitized upload/branding defaults.

During this audit, the program-year and program-research endpoints were changed from approved-user access to admin-only because they expose pending review metadata. Template listing/download now requires an approved account, matching the existing protected UI route.

## Storage policy

Both buckets must remain private. `anon` and `authenticated` need no `storage.objects` or `storage.buckets` privileges or policies because browser clients never call Supabase Storage. Existing custom Storage policies should be reviewed in the dashboard and removed if they grant either role access to `profile-images` or `research-files`. The migration revokes the underlying table privileges, so such policies cannot authorize access, while the service-role backend continues to bypass RLS.

## Deployment and verification

Apply `backend/migrations/20260820_enable_supabase_rls.sql` in the Supabase SQL Editor as the database owner. Before production rollout, confirm the deployed backend `DATABASE_URL` uses the owner (or a dedicated `BYPASSRLS` role), then execute the post-migration verification queries included at the bottom of the SQL file.

Functional verification should cover registration and approval/login; student and faculty submission/upload/revision/download flows; admin pending review and approval; notification ownership; accomplishment reports; completed papers; user management; settings; and both buckets. Anon and authenticated PostgREST requests to every application table and both Storage tables must be denied.
