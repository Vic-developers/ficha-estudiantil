import { useState } from "react";
import { Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { siteConfig } from "@/config/site";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }

    setSaving(true);
    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ name: trimmed })
          .eq("id", user.id);
        if (error) throw error;
        await refreshUser();
        toast.success("Perfil actualizado.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu perfil y consulta la información de la aplicación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi perfil</CardTitle>
          <CardDescription>
            Actualiza tu nombre público. El rol lo asigna un administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Acerca de
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Versión</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Aplicación</span>
            <span className="font-medium text-foreground">{siteConfig.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Almacenamiento de fotos</span>
            <span className="font-medium text-foreground">
              Bucket: {siteConfig.photoBucket}
            </span>
          </div>
          <Separator />
          <p className="pt-2">
            Aplicación diseñada para administrar el directorio estudiantil con
            Supabase (Base de datos, Autenticación y Storage) y desplegada en
            Vercel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}