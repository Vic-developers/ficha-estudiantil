import { MapPin, Pencil, School } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentPhoto } from "./StudentPhoto";
import { useAuth } from "@/hooks/useAuth";
import type { StudentItem } from "@/types";

interface StudentCardProps {
  student: StudentItem;
  onOpen: (student: StudentItem) => void;
  onEdit: (student: StudentItem) => void;
}

export function StudentCard({ student, onOpen, onEdit }: StudentCardProps) {
  const { isAdmin } = useAuth();

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        <button
          type="button"
          onClick={() => onOpen(student)}
          className="shrink-0"
          aria-label={`Ver ficha de ${student.full_name}`}
        >
          <StudentPhoto
            src={student.photo_url}
            fullName={student.full_name}
            className="h-20 w-16"
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">
            {student.full_name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
            <School className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.career?.name ?? "—"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {student.university?.name ?? "—"}
          </p>
        </div>
      </div>

      <CardContent className="px-4 pb-2">
        <p className="text-xs text-muted-foreground">
          Matrícula:{" "}
          <span className="font-medium text-foreground">
            {student.enrollment_number}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {student.location?.name ?? "—"}
        </p>
      </CardContent>

      <CardFooter className="gap-2 px-4 pb-4 pt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpen(student)}>
          Ver ficha
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => onEdit(student)} aria-label="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}