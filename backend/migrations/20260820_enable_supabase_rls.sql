-- CTED server-only data access boundary for Supabase PostgreSQL.
-- Run as the postgres/database-owner role in the Supabase SQL Editor.
-- FastAPI connects as the database owner through DATABASE_URL, so ordinary RLS
-- remains enabled without FORCE ROW LEVEL SECURITY. PostgREST roles receive no
-- table privileges and no policies; application authorization stays in FastAPI.

begin;

alter table if exists public.users enable row level security;
alter table if exists public.research_submissions enable row level security;
alter table if exists public.accomplishment_reports enable row level security;
alter table if exists public.templates enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.format_check_results enable row level security;
alter table if exists public.review_remarks enable row level security;
alter table if exists public.completed_papers enable row level security;
alter table if exists public.courses enable row level security;
alter table if exists public.system_settings enable row level security;

-- Defense in depth: PostgREST's browser-facing roles cannot query these tables,
-- even if a policy is accidentally added later.
revoke all privileges on table
  public.users,
  public.research_submissions,
  public.accomplishment_reports,
  public.templates,
  public.notifications,
  public.format_check_results,
  public.review_remarks,
  public.completed_papers,
  public.courses,
  public.system_settings
from anon, authenticated;

-- Keep both application buckets private. Storage access is server-side using the
-- service-role key; clients receive only short-lived signed URLs from FastAPI.
update storage.buckets
set public = false
where id in ('profile-images', 'research-files');

revoke all privileges on table storage.objects from anon, authenticated;
revoke all privileges on table storage.buckets from anon, authenticated;

commit;

-- Verification (expect ten rows with rowsecurity=true and zero policy rows):
-- select relname, relrowsecurity, relforcerowsecurity
-- from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
-- where nspname = 'public' and relname in
-- ('users','research_submissions','accomplishment_reports','templates',
--  'notifications','format_check_results','review_remarks','completed_papers',
--  'courses','system_settings') order by relname;
-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies where schemaname = 'public' and tablename in
-- ('users','research_submissions','accomplishment_reports','templates',
--  'notifications','format_check_results','review_remarks','completed_papers',
--  'courses','system_settings');
