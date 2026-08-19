import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

function UserMenu() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
          {(user?.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role === "admin" ? "Administrador" : "Consulta"}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => void signOut()}>
        Salir
      </Button>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar móvil (drawer) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r bg-white shadow-lg transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            type="button"
            className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block" />
            <UserMenu />
          </div>
        </header>

        <main className="container flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t py-4">
          <p className="container px-4 text-center text-xs text-muted-foreground sm:px-6">
            Ficha Estudiantil · Directorio estudiantil
          </p>
        </footer>
      </div>
    </div>
  );
}