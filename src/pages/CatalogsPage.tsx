import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Building2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import { useCatalogs } from "@/hooks/useCatalogs";
import { checkCatalogNameExists } from "@/services/catalogs";
import type { CatalogType } from "@/types";

const TYPE_META: Record<
  CatalogType,
  { title: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  universities: {
    title: "Universidades",
    description: "Administra las universidades del directorio.",
    icon: Building2,
  },
  careers: {
    title: "Carreras",
    description: "Administra las carreras del directorio.",
    icon: BookOpen,
  },
  locations: {
    title: "Ubicaciones",
    description: "Administra las ubicaciones del directorio.",
    icon: MapPin,
  },
};

export function CatalogsPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const catalogType = (type as CatalogType) ?? "universities";
  const meta = TYPE_META[catalogType] ?? TYPE_META.universities;

  const catalogs = useCatalogs();
  const items = useMemo(() => {
    if (catalogType === "universities") return catalogs.universities;
    if (catalogType === "careers") return catalogs.careers;
    return catalogs.locations;
  }, [catalogType, catalogs]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!TYPE_META[catalogType]) {
      navigate("/catalogs/universities");
    }
  }, [catalogType, navigate]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (id: string, itemName: string) => {
    setEditing({ id, name: itemName });
    setName(itemName);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const exists = await checkCatalogNameExists(
        catalogType,
        trimmed,
        editing?.id
      );
      if (exists) {
        toast.error("Ya existe un registro con ese nombre.");
        setSaving(false);
        return;
      }

      if (editing) {
        await catalogs.updateItem(catalogType, editing.id, trimmed);
        toast.success("Registro actualizado.");
      } else {
        await catalogs.createItem(catalogType, trimmed);
        toast.success("Registro creado.");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const result = await catalogs.deleteItem(catalogType, toDelete.id);
    if (result.error) {
      toast.error(
        result.error.includes("foreign key") ||
          result.error.includes("restrict") ||
          result.error.toLowerCase().includes("fails")
          ? "No se puede eliminar: está en uso por estudiantes."
          : result.error
      );
    } else {
      toast.success("Registro eliminado.");
      setToDelete(null);
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva {catalogType === "universities" ? "universidad" : catalogType === "careers" ? "carrera" : "ubicación"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Listado ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catalogs.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aún no hay registros. Crea el primero.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(item.id, item.name)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setToDelete({ id: item.id, name: item.name })}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar registro" : `Nueva ${catalogType === "universities" ? "universidad" : catalogType === "careers" ? "carrera" : "ubicación"}`}
            </DialogTitle>
            <DialogDescription>
              El nombre aparecerá en los filtros y formularios de estudiantes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Universidad Nacional del Caribe"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar registro"
        description={`¿Estás seguro de que deseas eliminar "${toDelete?.name}"?`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}