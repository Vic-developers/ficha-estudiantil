import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Shield, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import { NewUserDialog } from "@/components/users/NewUserDialog";
import { useAuth } from "@/hooks/useAuth";
import { listProfiles, updateUserRole } from "@/services/auth";
import { formatDateTime } from "@/lib/utils";
import type { Profile, UserRole } from "@/types";

export function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{
    profile: Profile;
    role: UserRole;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = (profile: Profile, role: UserRole) => {
    if (profile.role === role) return;
    setPending({ profile, role });
  };

  const confirmRoleChange = async () => {
    if (!pending) return;
    setSaving(true);
    const result = await updateUserRole(pending.profile.id, pending.role);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        `Rol de "${pending.profile.name}" actualizado a ${pending.role === "admin" ? "Administrador" : "Consulta"}.`
      );
      await load();
    }
    setPending(null);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles y crea cuentas de acceso al sistema.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cuentas ({profiles.length})</CardTitle>
          <CardDescription>
            Los administradores pueden gestionar catálogos, estudiantes e
            importaciones. El rol de consulta solo puede ver, buscar y generar
            reportes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay usuarios registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-44">Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                          {profile.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate font-medium">
                            {profile.name}
                            {profile.id === user?.id && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-normal text-muted-foreground">
                                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                                Tú
                              </span>
                            )}
                          </p>
                          {profile.role === "admin" && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              Administrador
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(profile.created_at)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(v) =>
                          handleRoleChange(profile, v as UserRole)
                        }
                        disabled={profile.id === user?.id}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consulta">
                            <span className="flex items-center gap-1">
                              <UserCog className="h-3.5 w-3.5" /> Consulta
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5" /> Administrador
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Cambiar rol de usuario"
        description={
          pending
            ? `¿Deseas asignar el rol "${pending.role === "admin" ? "Administrador" : "Consulta"}" a "${pending.profile.name}"? El cambio aplica inmediatamente.`
            : ""
        }
        confirmLabel="Cambiar rol"
        cancelLabel="Cancelar"
        loading={saving}
        onConfirm={() => void confirmRoleChange()}
      />
    </div>
  );
}