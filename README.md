# Ficha Estudiantil

Aplicación web moderna, minimalista y responsive para gestionar el directorio
estudiantil: registrar, consultar, editar, eliminar, filtrar y generar reportes
de estudiantes con su fotografía de carnet.

**Stack:** React + TypeScript + Tailwind CSS + shadcn/ui + Supabase (Auth,
Database y Storage) · Deploy en Vercel.

---

## 1. Requisitos

- Node.js **18 o superior** (recomendado 20+).
- Una cuenta en [Supabase](https://supabase.com) (proyecto gratuito suficiente).
- Opcional: cuenta en [Vercel](https://vercel.com) para el deploy.

---

## 2. Estructura del proyecto

```
ficha-estudiantil/
├── supabase/
│   └── migrations/            # SQL de esquema, RLS, storage y seed
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes base estilo shadcn/ui
│   │   ├── layout/            # Sidebar, header, layout responsive, guards
│   │   ├── students/          # Tarjetas, tabla, modal, filtros, formulario
│   │   ├── dashboard/         # Tarjetas estadísticas y gráficos
│   │   └── catalog/           # Gestión de catálogos
│   ├── pages/                 # Vistas por ruta
│   ├── services/              # Llamadas a Supabase (CRUD, auth, storage, export, import)
│   ├── hooks/                 # useAuth, useCatalogs, useDebounce, useStudentDirectory
│   ├── lib/                   # Cliente Supabase y utilidades
│   ├── types/                 # Tipos de dominio
│   └── config/                # Configuración de la app
├── .env.example               # Variables de entorno de ejemplo
└── package.json
```

---

## 3. Instalación

```bash
# Clona o copia el proyecto y entra en la carpeta
cd ficha-estudiantil

# Instala dependencias
npm install
```

---

## 4. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve a **Project Settings → API** y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

4. Edita `.env` con los valores reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

> La anon key es pública y segura de exponer en el frontend. Nunca uses la
> **service_role key** en el cliente.

---

## 5. Creación de tablas

Ejecuta los archivos de migración en el **SQL Editor** de Supabase en orden:

1. `supabase/migrations/0001_schema.sql` — tablas (`universities`, `careers`,
   `locations`, `students`, `profiles`), triggers de `updated_at`, funciones de
   autorización y políticas RLS.
2. `supabase/migrations/0002_storage.sql` — bucket `student-photos` y sus
   políticas de acceso.
3. `supabase/migrations/0003_seed.sql` — datos de demostración (8 universidades,
   12 carreras, 10 ubicaciones y 25 estudiantes ficticios).
4. `supabase/migrations/0004_aggregations.sql` — funciones RPC para los gráficos
   del dashboard.

También puedes pegar el contenido de los cuatro archivos en el SQL Editor y
ejecutarlos en una sola sesión.

### Esquema resumido

| Tabla         | Campos clave                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `students`    | `id`, `photo_url`, `full_name`, `university_id`, `enrollment_number`, `career_id`, `location_id`, `created_at`, `updated_at` |
| `universities`| `id`, `name` (único)                                                         |
| `careers`     | `id`, `name` (único)                                                         |
| `locations`   | `id`, `name` (único)                                                         |
| `profiles`    | `id` (→ `auth.users`), `name`, `role` (`admin` / `consulta`)                 |

`students` se relaciona con los catálogos mediante **IDs** (claves foráneas con
`on delete restrict`), evitando duplicar nombres.

---

## 6. Configuración de Storage

La migración `0002_storage.sql` crea automáticamente el bucket `student-photos`
público (lectura) con:

- **Lectura pública** (anon y authenticated): permite mostrar las fotos.
- **Escritura / actualización / borrado**: solo administradores
  (`public.is_admin()`).

Verifícalo en **Storage → Buckets → student-photos → Policies** si lo deseas.

---

## 7. Configuración de RLS

Todas las tablas tienen **Row Level Security** habilitado:

- **Lectura de catálogos y estudiantes**: cualquier usuario autenticado.
- **Escritura (insert/update/delete)**: solo administradores.
- **`profiles`**: cada usuario puede leer/actualizar su propio perfil; los
  administradores pueden leer y cambiar roles de todos.

Los roles se controlan con `public.is_admin()` y `public.current_user_role()`
(funciones `security definer` para evitar recursión con RLS).

---

## 8. Autenticación y primer administrador

1. **Regístrate** desde la app (pantalla de login). El perfil se crea
   automáticamente con rol **`consulta`** mediante un trigger.
2. **Promueve tu cuenta a administrador** en el SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'tu-email@dominio.com');
   ```

3. Cierra sesión y vuelve a entrar para que la app cargue el nuevo rol.

> Si tienes la **confirmación de correo activada**, el usuario recién registrado
> debe confirmar su email antes del primer inicio de sesión.

Los administradores pueden cambiar roles desde **Configuración → Usuarios**.

---

## 9. Ejecución local

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

### Comandos útiles

| Comando              | Descripción                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Servidor de desarrollo             |
| `npm run build`      | Typecheck + build de producción    |
| `npm run typecheck`  | Verificación de tipos              |
| `npm run preview`    | Previsualiza el build              |

---

## 10. Funcionalidades

- **Dashboard**: estadísticas en vivo (total de estudiantes, universidades,
  carreras, ubicaciones), buscador, filtros combinables y gráficos simples.
- **Búsqueda**: por nombre, matrícula, universidad, carrera y ubicación
  (insensible a acentos, con debounce).
- **Filtros**: universidad, carrera y ubicación combinables + "Limpiar filtros".
- **Vista estudiantes**: tarjetas o tabla con ordenamiento, búsqueda,
  paginación y acciones (ver / editar / eliminar).
- **Ficha individual**: foto ampliable, datos completos, edición, eliminación
  con confirmación y **PDF individual**.
- **CRUD de estudiantes**: alta con foto (JPG/PNG/WebP, validación de tipo y
  tamaño, compresión automática), edición que conserva la foto si no se
  reemplaza, y matrícula única.
- **Importación masiva**: CSV/Excel con vista previa, detección de duplicados y
  errores, y resumen (importados / duplicados / con errores).
- **Reportes**: filtros + **Exportar a Excel, CSV y PDF** con encabezado
  institucional, filtros usados, total y numeración de páginas.
- **Catálogos**: CRUD de universidades, carreras y ubicaciones.
- **Roles**: `admin` (gestión completa) y `consulta` (solo lectura y reportes).
- **UX**: loading states, skeleton loaders, toasts de éxito/error,
  confirmaciones y empty states.

---

## 11. Build de producción

```bash
npm run build
```

El resultado se genera en `dist/`.

---

## 12. Deploy en Vercel

1. Sube el repositorio a GitHub.
2. En [Vercel](https://vercel.com): **Add New → Project** e importa el repo.
3. Framework: **Vite** (se detecta automáticamente).
4. Añade las variables de entorno en **Settings → Environment Variables**:

   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```

5. Build command: `npm run build` · Output directory: `dist`.
6. **Deploy**. Vercel publicará la app en `https://tu-app.vercel.app`.

> Es una SPA con React Router: no requiere reescrituras adicionales porque el
> router usa rutas client-side sobre `/` (Vercel sirve `index.html` para `/`).
> Si usaras rutas profundas con refresco, añade una regla de reescritura
> `/* → /index.html`.

---

## 13. Seguridad

- Contraseñas gestionadas por **Supabase Auth** (nunca en texto plano).
- RLS en todas las tablas; las operaciones de escritura exigen rol admin.
- Validación MIME y límite de tamaño en las fotos (5 MB), con compresión a JPEG
  (máx. 800 px) antes de subir.
- Validación y sanitización de formularios.
- Confirmación obligatoria para acciones destructivas.
- Variables de entorno para credenciales; nunca se exponen claves privadas.

---

## 14. Datos de demostración

El seed (`0003_seed.sql`) incluye **25 estudiantes ficticios** con universidades,
carreras y ubicaciones de ejemplo, claramente marcados como demostración. No se
usan datos personales reales. Los estudiantes del seed no tienen fotografía
(hasta que se suban desde la app).

---

## 15. Personalización y extensión

La arquitectura permite agregar nuevos campos al estudiante fácilmente:

1. Agrega la columna en `students` (migración SQL).
2. Amplía el tipo `Student` en `src/types/index.ts`.
3. Añade el campo al formulario (`StudentFormPage`) y a la ficha
   (`StudentDetailPage`).
4. Para un nuevo filtro, agrega la entrada en `StudentFilters`, en
   `FilterControls` y en `fetchStudentsByCatalogFilters`.

---