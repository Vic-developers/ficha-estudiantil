import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Building2,
  FileBarChart,
  GraduationCap,
  Home,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [{ label: "Dashboard", to: "/", icon: Home, adminOnly: false }],
  },
  {
    title: "Estudiantes",
    items: [
      {
        label: "Todos los estudiantes",
        to: "/students",
        icon: Users,
        adminOnly: false,
      },
      { label: "Agregar estudiante", to: "/students/new", icon: UserPlus, adminOnly: true },
      { label: "Importar estudiantes", to: "/import", icon: Upload, adminOnly: true },
    ],
  },
  {
    title: "Catálogos",
    items: [
      {
        label: "Universidades",
        to: "/catalogs/universities",
        icon: Building2,
        adminOnly: true,
      },
      {
        label: "Carreras",
        to: "/catalogs/careers",
        icon: BookOpen,
        adminOnly: true,
      },
      {
        label: "Ubicaciones",
        to: "/catalogs/locations",
        icon: MapPin,
        adminOnly: true,
      },
    ],
  },
  {
    title: "Reportes",
    items: [
      { label: "Reportes", to: "/reports", icon: FileBarChart, adminOnly: false },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Usuarios", to: "/settings/users", icon: ShieldCheck, adminOnly: true },
      { label: "Configuración", to: "/settings", icon: Settings, adminOnly: false },
    ],
  },
];

function NavList() {
  const { isAdmin } = useAuth();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter((i) => !i.adminOnly || isAdmin);
        if (items.length === 0) return null;

        return (
          <div key={section.title}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/" || item.to === "/students" || item.to === "/reports"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Ficha Estudiantil</p>
          <p className="text-xs text-muted-foreground">Directorio estudiantil</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <NavList />
      </div>

      <div className="border-t px-3 py-3">
        <div className="flex items-center justify-between gap-2 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {(user?.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === "admin" ? "Administrador" : "Consulta"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return <SidebarContent />;
}