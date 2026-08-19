-- ============================================================
-- Ficha Estudiantil - Migración 0004: Agregaciones para gráficos
-- Funciones RPC usadas por el dashboard.
-- ============================================================

-- Estudiantes por universidad
create or replace function public.students_by_university()
returns table (name text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select u.name, count(s.id)::bigint as count
  from public.universities u
  left join public.students s on s.university_id = u.id
  group by u.id, u.name
  order by count desc, u.name asc;
$$;

-- Estudiantes por carrera
create or replace function public.students_by_career()
returns table (name text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.name, count(s.id)::bigint as count
  from public.careers c
  left join public.students s on s.career_id = c.id
  group by c.id, c.name
  order by count desc, c.name asc;
$$;

-- Estudiantes por ubicación
create or replace function public.students_by_location()
returns table (name text, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select l.name, count(s.id)::bigint as count
  from public.locations l
  left join public.students s on s.location_id = l.id
  group by l.id, l.name
  order by count desc, l.name asc;
$$;

-- Permisos de ejecución (solo usuarios autenticados)
revoke all on function public.students_by_university() from public, anon;
grant execute on function public.students_by_university() to authenticated;
revoke all on function public.students_by_career() from public, anon;
grant execute on function public.students_by_career() to authenticated;
revoke all on function public.students_by_location() from public, anon;
grant execute on function public.students_by_location() to authenticated;