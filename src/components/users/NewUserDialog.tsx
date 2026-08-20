import { useEffect, useState } from "react";
import { Loader2, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminCreateUser } from "@/services/auth";
import type { UserRole } from "@/types";

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewUserDialog({ open, onOpenChange, onCreated }: NewUserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("consulta");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("consulta");
    }
  }, [open]);

  const canSubmit =
    name.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const result = await adminCreateUser({
      email: email.trim(),
      password,
      name: name.trim(),
      role,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Usuario "${name.trim()}" creado correctamente.`);
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Crea una cuenta para otra persona. Podrá iniciar sesión
            inmediatamente con las credenciales que asignes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Nombre completo</Label>
            <Input
              id="new-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María Rodríguez"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-user-email">Correo electrónico</Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-user-password">Contraseña</Label>
            <Input
              id="new-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
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
            <p className="text-xs text-muted-foreground">
              Consulta solo puede ver, buscar y generar reportes. Administrador
              gestiona catálogos, estudiantes e importaciones.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}