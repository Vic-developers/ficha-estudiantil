import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Shield,
  UserCog,
  UserPlus,
  XCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
import {
  listProfiles,
  updateUserRole,
  updateUserStatus,
} from "@/services/auth";
import { formatDateTime } from "@/lib/utils";
import type { Profile, ProfileStatus, UserRole } from "@/types";

const STATUS_META: Record<
  ProfileStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "warning" },
  approved: { label: "Aprobado", variant: "success" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

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
  const [toReject, setToReject] = useState<Profile | null>(null);
  const [rejecting, setRejecting] = useState(false);

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

  const sortedProfiles = useMemo(() => {
    const rank = (status: ProfileStatus) =>
      status === "pending" ? 0 : status === "approved" ? 1 : 2;
    return [...profiles].sort(
      (a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name)
    );
  }, [profiles]);

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

  const handleApprove = async (profile: Profile) => {
    const result = await updateUserStatus(profile.id, "approved");
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Usuario "${profile.name}" aprobado. Ya puede iniciar sesión.`);
    await load();
  };

  const confirmReject = async () => {
    if (!toReject) return;
    setRejecting(true);
    const result = await updateUserStatus(toReject.id, "rejected");
    setRejecting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Usuario "${toReject.name}" rechazado.`);
    setToReject(null);
    await load();
  };

  const pendingCount = profiles.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Aproba las cuentas nuevas y administra los roles de acceso al sistema.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Cuentas ({profiles.length})
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Los usuarios registrados quedan pendientes hasta que los apruebes.
            Los administradores gestionan catálogos, estudiantes e importaciones;
            el rol de consulta solo puede ver, buscar y generar reportes.
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-44">Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProfiles.map((profile) => (
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
                      <Badge variant={STATUS_META[profile.status].variant}>
                        {STATUS_META[profile.status].label}
                      </Badge>
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
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {profile.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-emerald-600"
                            onClick={() => void handleApprove(profile)}
                            aria-label={`Aprobar a ${profile.name}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprobar
                          </Button>
                        )}
                        {profile.status === "approved" &&
                          profile.id !== user?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => setToReject(profile)}
                              aria-label={`Rechazar a ${profile.name}`}
                            >
                              <XCircle className="h-4 w-4" />
                              Rechazar
                            </Button>
                          )}
                      </div>
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

      <ConfirmDialog
        open={toReject !== null}
        onOpenChange={(open) => !open && setToReject(null)}
        title="Rechazar usuario"
        description={`¿Deseas rechazar a "${toReject?.name}"? La persona no podrá iniciar sesión hasta que lo apruebes de nuevo.`}
        confirmLabel="Rechazar"
        cancelLabel="Cancelar"
        destructive
        loading={rejecting}
        onConfirm={() => void confirmReject()}
      />
    </div>
  );
}