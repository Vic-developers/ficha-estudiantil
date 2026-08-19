-- ============================================================
-- Ficha Estudiantil - Migración 0002: Storage
-- Bucket para fotografías de carnets y políticas de acceso
-- ============================================================

-- Crear el bucket (acceso público de lectura para mostrar las fotos)
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

-- Lectura pública del bucket (fotos de carnet visibles para usuarios autenticados)
create policy "student_photos_select_public"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'student-photos');

-- Lectura anónima para URLs públicas
create policy "student_photos_select_anon"
  on storage.objects for select
  to anon
  using (bucket_id = 'student-photos');

-- Escritura restringida a administradores
create policy "student_photos_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'student-photos' and public.is_admin());

-- Actualización restringida a administradores
create policy "student_photos_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'student-photos' and public.is_admin());

-- Eliminación restringida a administradores
create policy "student_photos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'student-photos' and public.is_admin());