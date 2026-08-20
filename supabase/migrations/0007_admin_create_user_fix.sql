-- ============================================================
-- Ficha Estudiantil - Migración 0007: Fix search_path
-- pgcrypto (crypt/gen_salt) vive en el esquema `extensions`,
-- que PostgREST no incluye en el search_path por defecto.
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
set search_path = public, extensions, auth
as $$
declare
  v_user_id uuid;
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

  v_user_id := gen_random_uuid();

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, is_sso_user
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    lower(p_email), crypt(p_password, gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_name),
    now(), now(), '', '', '', '', false
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
    'email', v_user_id::text, now(), now(), now()
  );

  update public.profiles
  set role = p_role,
      name = p_name
  where id = v_user_id;

  return v_user_id;
end;
$$;

revoke all on function public.admin_create_user(text, text, text, text) from public;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;