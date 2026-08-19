-- ============================================================
-- Ficha Estudiantil - Migración 0001: Esquema principal
-- Tablas, funciones, triggers y políticas RLS
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Catálogos
-- ------------------------------------------------------------

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Estudiantes
-- ------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  photo_url text,
  full_name text not null check (char_length(trim(full_name)) > 0),
  university_id uuid not null references public.universities(id) on delete restrict,
  enrollment_number text not null unique check (char_length(trim(enrollment_number)) > 0),
  career_id uuid not null references public.careers(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_full_name_idx on public.students (full_name);
create index if not exists students_enrollment_number_idx on public.students (enrollment_number);
create index if not exists students_university_id_idx on public.students (university_id);
create index if not exists students_career_id_idx on public.students (career_id);
create index if not exists students_location_id_idx on public.students (location_id);

-- ------------------------------------------------------------
-- Perfiles de usuario (vinculados a Supabase Auth)
-- Rol: admin | consulta
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'consulta' check (role in ('admin', 'consulta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger para mantener updated_at
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_universities on public.universities;
create trigger set_updated_at_universities
  before update on public.universities
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_careers on public.careers;
create trigger set_updated_at_careers
  before update on public.careers
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_locations on public.locations;
create trigger set_updated_at_locations
  before update on public.locations
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_students on public.students;
create trigger set_updated_at_students
  before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Funciones auxiliares de autorización
-- ------------------------------------------------------------

-- Retorna true si el usuario autenticado es administrador.
-- Usa security definer para evitar recursión con RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Retorna el rol del usuario autenticado ('admin' | 'consulta' | null)
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Trigger: crear perfil automáticamente al registrarse
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'consulta'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RLS: UNIVERSITIES
-- ------------------------------------------------------------

alter table public.universities enable row level security;

create policy "universities_select_authenticated"
  on public.universities for select
  to authenticated
  using (true);

create policy "universities_insert_admin"
  on public.universities for insert
  to authenticated
  with check (public.is_admin());

create policy "universities_update_admin"
  on public.universities for update
  to authenticated
  using (public.is_admin());

create policy "universities_delete_admin"
  on public.universities for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: CAREERS
-- ------------------------------------------------------------

alter table public.careers enable row level security;

create policy "careers_select_authenticated"
  on public.careers for select
  to authenticated
  using (true);

create policy "careers_insert_admin"
  on public.careers for insert
  to authenticated
  with check (public.is_admin());

create policy "careers_update_admin"
  on public.careers for update
  to authenticated
  using (public.is_admin());

create policy "careers_delete_admin"
  on public.careers for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: LOCATIONS
-- ------------------------------------------------------------

alter table public.locations enable row level security;

create policy "locations_select_authenticated"
  on public.locations for select
  to authenticated
  using (true);

create policy "locations_insert_admin"
  on public.locations for insert
  to authenticated
  with check (public.is_admin());

create policy "locations_update_admin"
  on public.locations for update
  to authenticated
  using (public.is_admin());

create policy "locations_delete_admin"
  on public.locations for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: STUDENTS
-- ------------------------------------------------------------

alter table public.students enable row level security;

create policy "students_select_authenticated"
  on public.students for select
  to authenticated
  using (true);

create policy "students_insert_admin"
  on public.students for insert
  to authenticated
  with check (public.is_admin());

create policy "students_update_admin"
  on public.students for update
  to authenticated
  using (public.is_admin());

create policy "students_delete_admin"
  on public.students for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: PROFILES
-- ------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin());