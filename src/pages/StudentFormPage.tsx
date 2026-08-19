import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/students/Combobox";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import { useCatalogs } from "@/hooks/useCatalogs";
import {
  checkEnrollmentExists,
  createStudent,
  fetchStudent,
  updateStudent,
} from "@/services/students";
import {
  deletePhoto,
  processPhoto,
  uploadPhoto,
  validatePhoto,
} from "@/services/storage";
import { siteConfig } from "@/config/site";
import type { StudentInput } from "@/types";

interface FormState {
  full_name: string;
  university_id: string;
  enrollment_number: string;
  career_id: string;
  location_id: string;
}

const EMPTY_FORM: FormState = {
  full_name: "",
  university_id: "",
  enrollment_number: "",
  career_id: "",
  location_id: "",
};

export function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const catalogs = useCatalogs();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    fetchStudent(id!)
      .then((student) => {
        if (!active || !student) return;
        setForm({
          full_name: student.full_name,
          university_id: student.university_id,
          enrollment_number: student.enrollment_number,
          career_id: student.career_id,
          location_id: student.location_id,
        });
        setPhotoUrl(student.photo_url);
        setOriginalPhotoUrl(student.photo_url);
        setLoadingInitial(false);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "Error al cargar el estudiante");
        navigate("/students");
      });

    return () => {
      active = false;
    };
  }, [id, isEdit, navigate]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    const validation = validatePhoto(file);
    if (!validation.ok) {
      toast.error(validation.error ?? "Imagen inválida.");
      return;
    }

    try {
      const blob = await processPhoto(file);
      setNewPhotoBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    }
  };

  const removePhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setNewPhotoBlob(null);
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = async (): Promise<boolean> => {
    const nextErrors: Record<string, string> = {};

    if (!form.full_name.trim()) nextErrors.full_name = "El nombre completo es obligatorio.";
    if (!form.enrollment_number.trim()) {
      nextErrors.enrollment_number = "La matrícula es obligatoria.";
    } else {
      try {
        const exists = await checkEnrollmentExists(form.enrollment_number.trim(), id);
        if (exists) {
          nextErrors.enrollment_number =
            "Esta matrícula ya está registrada para otro estudiante.";
        }
      } catch {
        // si falla la verificación, se continúa
      }
    }
    if (!form.university_id) nextErrors.university_id = "Selecciona una universidad.";
    if (!form.career_id) nextErrors.career_id = "Selecciona una carrera.";
    if (!form.location_id) nextErrors.location_id = "Selecciona una ubicación.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = useCallback(async () => {
    setSaving(true);

    const input: StudentInput = {
      full_name: form.full_name,
      university_id: form.university_id,
      enrollment_number: form.enrollment_number,
      career_id: form.career_id,
      location_id: form.location_id,
      photo_url: photoUrl,
    };

    // Si hay foto nueva, primero subirla y actualizar la URL.
    if (newPhotoBlob) {
      try {
        input.photo_url = await uploadPhoto(newPhotoBlob, originalPhotoUrl);
      } catch (err) {
        setSaving(false);
        toast.error(
          err instanceof Error ? err.message : "No se pudo subir la foto."
        );
        return;
      }
    } else if (isEdit && photoUrl === null && originalPhotoUrl) {
      // Foto eliminada: limpiar la referencia (la limpieza del archivo se
      // intenta al guardar).
      deletePhoto(originalPhotoUrl).catch(() => undefined);
    }

    try {
      if (isEdit) {
        await updateStudent(id!, input);
        toast.success("Estudiante actualizado correctamente.");
      } else {
        await createStudent(input);
        toast.success("Estudiante registrado correctamente.");
      }
      navigate("/students");
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Error al guardar el estudiante.");
    }
  }, [form, isEdit, id, newPhotoBlob, originalPhotoUrl, photoUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await validate();
    if (!valid) {
      toast.error("Revisa los campos marcados.");
      return;
    }

    if (isEdit) {
      setConfirmOpen(true);
      return;
    }
    await save();
  };

  const selectOptions = useMemo(
    () => ({
      universities: catalogs.universities.map((u) => ({ id: u.id, name: u.name })),
      careers: catalogs.careers.map((c) => ({ id: c.id, name: c.name })),
      locations: catalogs.locations.map((l) => ({ id: l.id, name: l.name })),
    }),
    [catalogs]
  );

  if (loadingInitial) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/students" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Skeleton className="h-7 w-56" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={isEdit ? `/students/${id}` : "/students"} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEdit ? "Editar estudiante" : "Agregar estudiante"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Modifica la información y guarda los cambios."
              : "Completa los campos para registrar un nuevo estudiante."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Fotografía del carnet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {preview ? (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto actual"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
                    <ImagePlus className="h-8 w-8" />
                    Sin foto
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => void handleFileChange(e.target.files?.[0])}
                />
                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {preview || (isEdit && photoUrl) ? "Reemplazar foto" : "Subir foto"}
                  </Button>
                  {(preview || (isEdit && photoUrl)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={removePhoto}
                    >
                      <Trash2 className="h-4 w-4" />
                      Quitar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, JPEG, PNG o WebP. Máximo {siteConfig.maxPhotoSizeMb} MB.
                  Las imágenes se comprimen automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información del estudiante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Nombre completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => set({ full_name: e.target.value })}
                placeholder="Ej. Juan Pérez Gómez"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Universidad <span className="text-destructive">*</span>
              </Label>
              <Combobox
                value={form.university_id || null}
                onChange={(v) => set({ university_id: v ?? "" })}
                options={selectOptions.universities}
                placeholder="Selecciona una universidad…"
                searchPlaceholder="Buscar universidad…"
              />
              {errors.university_id && (
                <p className="text-sm text-destructive">{errors.university_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="enrollment_number">
                  Matrícula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="enrollment_number"
                  value={form.enrollment_number}
                  onChange={(e) => set({ enrollment_number: e.target.value })}
                  placeholder="Ej. FE-2026-0001"
                />
                {errors.enrollment_number && (
                  <p className="text-sm text-destructive">
                    {errors.enrollment_number}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Carrera <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  value={form.career_id || null}
                  onChange={(v) => set({ career_id: v ?? "" })}
                  options={selectOptions.careers}
                  placeholder="Selecciona una carrera…"
                  searchPlaceholder="Buscar carrera…"
                />
                {errors.career_id && (
                  <p className="text-sm text-destructive">{errors.career_id}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Ubicación <span className="text-destructive">*</span>
              </Label>
              <Combobox
                value={form.location_id || null}
                onChange={(v) => set({ location_id: v ?? "" })}
                options={selectOptions.locations}
                placeholder="Selecciona una ubicación…"
                searchPlaceholder="Buscar ubicación…"
              />
              {errors.location_id && (
                <p className="text-sm text-destructive">{errors.location_id}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/students/${id}` : "/students")}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Registrar estudiante"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Guardar cambios"
        description="¿Deseas guardar los cambios realizados en la ficha de este estudiante?"
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        loading={saving}
        onConfirm={() => void save()}
      />
    </div>
  );
}