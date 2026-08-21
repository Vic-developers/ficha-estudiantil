-- ============================================================
-- Ficha Estudiantil - Migración 0008: Aprobación de usuarios
-- Los nuevos registros quedan 'pending' hasta que un admin los
-- apruebe. Solo cuentas 'approved' pueden iniciar sesión.
-- ============================================================

alter table public.profiles
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Las cuentas existentes quedan aprobadas
update public.profiles set status = 'approved' where status = 'pending';

create index if not exists profiles_status_idx on public.profiles (status);

-- Los nuevos registros inician en 'pending'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'consulta',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Las cuentas creadas por un admin quedan aprobadas de inmediato
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
      name = p_name,
      status = 'approved'
  where id = v_user_id;

  return v_user_id;
end;
$$;

revoke all on function public.admin_create_user(text, text, text, text) from public;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;

-- RLS: evitar que un usuario se auto-apruebe o cambie su estado
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and status = 'approved');