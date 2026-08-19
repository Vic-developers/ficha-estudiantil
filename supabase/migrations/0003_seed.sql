-- ============================================================
-- Ficha Estudiantil - Migración 0003: Datos de demostración
-- Universidades, carreras, ubicaciones y estudiantes ficticios.
-- ============================================================

-- ------------------------------------------------------------
-- Universidades
-- ------------------------------------------------------------
insert into public.universities (name) values
  ('Universidad Nacional del Caribe'),
  ('Universidad Adventista Dominicana'),
  ('Instituto Tecnológico del Este'),
  ('Universidad Metropolitana del Sur'),
  ('Universidad Católica del Norte'),
  ('Academia Superior de Ciencias'),
  ('Universidad Libre de las Américas'),
  ('Instituto Superior Politécnico')
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- Carreras
-- ------------------------------------------------------------
insert into public.careers (name) values
  ('Ingeniería de Software'),
  ('Administración de Empresas'),
  ('Medicina'),
  ('Derecho'),
  ('Arquitectura'),
  ('Contabilidad'),
  ('Psicología'),
  ('Marketing Digital'),
  ('Ingeniería Civil'),
  ('Diseño Gráfico'),
  ('Educación'),
  ('Enfermería')
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- Ubicaciones
-- ------------------------------------------------------------
insert into public.locations (name) values
  ('Santo Domingo'),
  ('Santiago'),
  ('La Vega'),
  ('San Pedro de Macorís'),
  ('Puerto Plata'),
  ('Higüey'),
  ('San Cristóbal'),
  ('Moca'),
  ('Bonao'),
  ('Barahona')
on conflict (name) do nothing;

-- ------------------------------------------------------------
-- Estudiantes ficticios
-- ------------------------------------------------------------
with
  uni as (select id, name from public.universities),
  car as (select id, name from public.careers),
  loc as (select id, name from public.locations)
insert into public.students (full_name, university_id, enrollment_number, career_id, location_id)
select
  s.full_name,
  u.id,
  s.matricula,
  c.id,
  l.id
from (values
  ('Ana María Rodríguez',    'Universidad Nacional del Caribe',      'FE-2026-0001', 'Ingeniería de Software',    'Santo Domingo'),
  ('Luis Fernando Pérez',    'Universidad Adventista Dominicana',    'FE-2026-0002', 'Administración de Empresas','Santiago'),
  ('Carlos Alberto Gómez',   'Instituto Tecnológico del Este',       'FE-2026-0003', 'Ingeniería de Software',    'La Vega'),
  ('María Fernanda Díaz',    'Universidad Metropolitana del Sur',    'FE-2026-0004', 'Medicina',                 'San Pedro de Macorís'),
  ('José Miguel Sánchez',    'Universidad Católica del Norte',       'FE-2026-0005', 'Derecho',                  'Puerto Plata'),
  ('Laura Patricia Fernández','Academia Superior de Ciencias',       'FE-2026-0006', 'Arquitectura',             'Santo Domingo'),
  ('Pedro Antonio Ramírez',  'Universidad Libre de las Américas',    'FE-2026-0007', 'Contabilidad',             'Higüey'),
  ('Carmen Rosa Martínez',   'Instituto Superior Politécnico',       'FE-2026-0008', 'Psicología',               'San Cristóbal'),
  ('Jorge Luis Castillo',    'Universidad Nacional del Caribe',      'FE-2026-0009', 'Marketing Digital',        'Santiago'),
  ('Yolanda Mercedes Reyes', 'Universidad Adventista Dominicana',    'FE-2026-0010', 'Ingeniería Civil',         'Moca'),
  ('Ricardo Antonio Cruz',   'Instituto Tecnológico del Este',       'FE-2026-0011', 'Diseño Gráfico',           'Bonao'),
  ('Silvia Elena Medina',    'Universidad Metropolitana del Sur',    'FE-2026-0012', 'Educación',                'Barahona'),
  ('Fernando Javier Luna',   'Universidad Católica del Norte',       'FE-2026-0013', 'Enfermería',               'Santo Domingo'),
  ('Rosa Amelia Vargas',     'Academia Superior de Ciencias',        'FE-2026-0014', 'Administración de Empresas','Santiago'),
  ('Miguel Ángel Torres',    'Universidad Libre de las Américas',    'FE-2026-0015', 'Ingeniería de Software',    'La Vega'),
  ('Patricia del Carmen Núñez','Instituto Superior Politécnico',     'FE-2026-0016', 'Derecho',                  'San Pedro de Macorís'),
  ('Oscar Eduardo Herrera',  'Universidad Nacional del Caribe',      'FE-2026-0017', 'Contabilidad',             'Puerto Plata'),
  ('Julia Cristina Peña',    'Universidad Adventista Dominicana',    'FE-2026-0018', 'Psicología',               'Higüey'),
  ('Ramón Andrés Guzmán',    'Instituto Tecnológico del Este',       'FE-2026-0019', 'Ingeniería Civil',         'San Cristóbal'),
  ('Evelyn Carolina Rojas',  'Universidad Metropolitana del Sur',    'FE-2026-0020', 'Medicina',                 'Moca'),
  ('Héctor Manuel Vidal',    'Universidad Católica del Norte',       'FE-2026-0021', 'Arquitectura',             'Bonao'),
  ('Gloria Elizabeth Suárez','Academia Superior de Ciencias',        'FE-2026-0022', 'Educación',                'Santo Domingo'),
  ('Francisco Javier Aquino','Universidad Libre de las Américas',    'FE-2026-0023', 'Marketing Digital',        'Santiago'),
  ('Sandra Patricia Mora',   'Instituto Superior Politécnico',       'FE-2026-0024', 'Enfermería',               'La Vega'),
  ('Juan Pablo Encarnación', 'Universidad Nacional del Caribe',      'FE-2026-0025', 'Ingeniería de Software',    'Santo Domingo')
) as s(full_name, universidad, matricula, carrera, ubicacion)
join uni u on u.name = s.universidad
join car c on c.name = s.carrera
join loc l on l.name = s.ubicacion
on conflict (enrollment_number) do nothing;

-- ------------------------------------------------------------
-- Nota: para crear el primer usuario administrador:
-- 1. Regístrate desde la app (el rol por defecto será "consulta").
-- 2. En el SQL Editor de Supabase ejecuta:
--
--    update public.profiles
--    set role = 'admin'
--    where id = (select id from auth.users where email = 'tu-email@dominio.com');
--
-- 3. Cierra sesión y vuelve a iniciarla para que la app cargue el nuevo rol.
-- ------------------------------------------------------------