import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileDown,
  MapPin,
  Pencil,
  School,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentPhoto } from "@/components/students/StudentPhoto";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { deleteStudent, fetchStudent } from "@/services/students";
import type { StudentItem } from "@/types";

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [student, setStudent] = useState<StudentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchStudent(id!)
      .then((data) => {
        if (!active) return;
        if (!data) {
          toast.error("Estudiante no encontrado.");
          navigate("/students");
          return;
        }
        setStudent(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "Error al cargar la ficha.");
        navigate("/students");
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      await deleteStudent(student);
      toast.success(`Estudiante "${student.full_name}" eliminado.`);
      navigate("/students");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar.");
      setDeleting(false);
    }
  };

  const handlePdf = async () => {
    if (!student) return;
    setPdfLoading(true);
    try {
      const { exportSingleStudentPdf } = await import("@/services/single-pdf");
      await exportSingleStudentPdf(student);
      toast.success("Ficha PDF generada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/students" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
          <Skeleton className="h-64 w-full rounded-xl sm:h-full" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/students" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Ficha del estudiante</h1>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[180px_1fr]">
          <div className="flex justify-center sm:block">
            <button
              type="button"
              onClick={() => student.photo_url && setPhotoOpen(true)}
              className="group relative"
              aria-label="Ver foto en tamaño completo"
              disabled={!student.photo_url}
            >
              <StudentPhoto
                src={student.photo_url}
                fullName={student.full_name}
                className="h-56 w-40 sm:h-64 sm:w-48"
              />
              {student.photo_url && (
                <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/40 py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Ver completo
                </span>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {student.career?.name ?? "—"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                icon={School}
                label="Universidad"
                value={student.university?.name ?? "—"}
              />
              <Field
                icon={BookOpen}
                label="Carrera"
                value={student.career?.name ?? "—"}
              />
              <Field
                icon={MapPin}
                label="Ubicación"
                value={student.location?.name ?? "—"}
              />
              <Field
                icon={School}
                label="Matrícula"
                value={student.enrollment_number}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Button>
        <Button variant="outline" onClick={() => void handlePdf()} disabled={pdfLoading}>
          <FileDown className="h-4 w-4" />
          {pdfLoading ? "Generando…" : "Generar ficha PDF"}
        </Button>
        {isAdmin && (
          <>
            <Button variant="outline" onClick={() => navigate(`/students/${student.id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Editar estudiante
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar estudiante
            </Button>
          </>
        )}
      </div>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-md p-2">
          <DialogTitle className="sr-only">Foto del carnet</DialogTitle>
          <img
            src={student.photo_url ?? undefined}
            alt={`Foto de ${student.full_name}`}
            className="w-full rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar estudiante"
        description={`¿Estás seguro de que deseas eliminar a "${student.full_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}