-- ============================================================
-- Ficha Estudiantil - Migración 0009: Bloqueo de auto-aprobación
-- Un usuario no puede cambiar su propio rol ni estado; solo un
-- administrador puede hacerlo (independiente de las políticas RLS).
-- ============================================================

create or replace function public.guard_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Solo un administrador puede cambiar el rol.';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Solo un administrador puede cambiar el estado de la cuenta.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_admin_fields on public.profiles;
create trigger guard_profile_admin_fields
  before update on public.profiles
  for each row execute function public.guard_profile_admin_fields();