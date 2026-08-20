-- ============================================================
-- Ficha Estudiantil - Migración 0005: Alta de usuarios desde la app
-- Función RPC (solo administradores) para crear cuentas confirmadas
-- ============================================================

create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user auth.users;
begin
  if p_role not in ('admin', 'consulta') then
    raise exception 'Rol inválido.';
  end if;

  if not public.is_admin() then
    raise exception 'No tienes permisos para crear usuarios.';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Ya existe un usuario con ese correo.';
  end if;

  v_user := auth.admin.create_user(
    user_email => p_email,
    user_password => p_password,
    email_confirm => true,
    user_metadata => jsonb_build_object('name', p_name)
  );

  update public.profiles
  set role = p_role,
      name = p_name
  where id = v_user.id;

  return v_user.id;
end;
$$;

revoke all on function public.admin_create_user(text, text, text, text) from public;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;