import { useNavigate } from "react-router-dom";
import { MapPin, School, University } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StudentPhoto } from "./StudentPhoto";
import { useAuth } from "@/hooks/useAuth";
import type { StudentItem } from "@/types";

interface StudentModalProps {
  student: StudentItem | null;
  onClose: () => void;
}

/** Ficha rápida en modal al hacer clic en un estudiante. */
export function StudentModal({ student, onClose }: StudentModalProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <Dialog open={student !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        {student && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">{student.full_name}</DialogTitle>
              <DialogDescription className="text-center">
                {student.career?.name ?? "—"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
              <StudentPhoto
                src={student.photo_url}
                fullName={student.full_name}
                className="h-40 w-32"
              />
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <University className="h-4 w-4 shrink-0" />
                  {student.university?.name ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <School className="h-4 w-4 shrink-0" />
                  {student.career?.name ?? "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">Matrícula:</span>
                  {student.enrollment_number}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {student.location?.name ?? "—"}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    navigate(`/students/${student.id}/edit`);
                  }}
                >
                  Editar
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  navigate(`/students/${student.id}`);
                }}
              >
                Ver ficha completa
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}