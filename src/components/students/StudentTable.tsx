import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StudentPhoto } from "./StudentPhoto";
import { useAuth } from "@/hooks/useAuth";
import type { StudentItem } from "@/types";
import { cn } from "@/lib/utils";

export type SortKey = "full_name" | "enrollment_number" | "university" | "career" | "location";
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

interface StudentTableProps {
  students: StudentItem[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onOpen: (student: StudentItem) => void;
  onEdit: (student: StudentItem) => void;
  onDelete: (student: StudentItem) => void;
}

const COLUMNS: Array<{ key: SortKey | null; label: string }> = [
  { key: null, label: "Foto" },
  { key: "full_name", label: "Nombre" },
  { key: "enrollment_number", label: "Matrícula" },
  { key: "university", label: "Universidad" },
  { key: "career", label: "Carrera" },
  { key: "location", label: "Ubicación" },
];

export function StudentTable({
  students,
  sort,
  onSortChange,
  onOpen,
  onEdit,
  onDelete,
}: StudentTableProps) {
  const { isAdmin } = useAuth();

  const toggleSort = (key: SortKey) => {
    if (sort.key === key) {
      onSortChange({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col) =>
              col.key ? (
                <TableHead key={col.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(col.key as SortKey)}
                  >
                    {col.label}
                    {sort.key === col.key ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
              ) : (
                <TableHead key={col.label}>{col.label}</TableHead>
              )
            )}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(student)}
                  aria-label={`Ver ficha de ${student.full_name}`}
                >
                  <StudentPhoto
                    src={student.photo_url}
                    fullName={student.full_name}
                    className="h-12 w-9"
                  />
                </button>
              </TableCell>
              <TableCell className="font-medium">{student.full_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {student.enrollment_number}
              </TableCell>
              <TableCell className="max-w-[180px] truncate text-muted-foreground">
                {student.university?.name ?? "—"}
              </TableCell>
              <TableCell className="max-w-[160px] truncate text-muted-foreground">
                {student.career?.name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.location?.name ?? "—"}
              </TableCell>
              <TableCell>
                <div
                  className={cn(
                    "flex items-center justify-end gap-0.5",
                    isAdmin ? "w-[132px]" : "w-9"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onOpen(student)}
                    aria-label="Ver"
                    title="Ver"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(student)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(student)}
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}