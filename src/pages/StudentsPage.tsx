import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Table2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterControls } from "@/components/students/FilterControls";
import { StudentCard } from "@/components/students/StudentCard";
import { StudentTable, type SortState } from "@/components/students/StudentTable";
import { StudentModal } from "@/components/students/StudentModal";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import { EmptyState } from "@/components/students/EmptyState";
import { Pagination } from "@/components/students/Pagination";
import { useStudentDirectory } from "@/hooks/useStudentDirectory";
import { useCatalogs } from "@/hooks/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import { deleteStudent } from "@/services/students";
import { clearFilters, hasActiveFilters } from "@/lib/filter-utils";
import { paginate, sortStudents } from "@/lib/student-list";
import { siteConfig } from "@/config/site";
import type { StudentFilters, StudentItem } from "@/types";

function CardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StudentsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const catalogs = useCatalogs();

  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    universityId: null,
    careerId: null,
    locationId: null,
  });
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sort, setSort] = useState<SortState>({
    key: "full_name",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentItem | null>(null);
  const [toDelete, setToDelete] = useState<StudentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { students, loading, error } = useStudentDirectory(
    {
      universityId: filters.universityId,
      careerId: filters.careerId,
      locationId: filters.locationId,
    },
    filters.search,
    { refreshKey }
  );

  const hasFilters = hasActiveFilters(filters);
  const sorted = useMemo(() => sortStudents(students, sort), [students, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / siteConfig.itemsPerPage));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const currentPageItems = useMemo(
    () => paginate(sorted, page, siteConfig.itemsPerPage),
    [sorted, page]
  );

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteStudent(toDelete);
      toast.success(`Estudiante "${toDelete.full_name}" eliminado.`);
      setToDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }, [toDelete]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Todos los estudiantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta, busca y filtra el directorio estudiantil.
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "cards" | "table")}>
            <TabsList>
              <TabsTrigger value="cards">
                <LayoutGrid className="h-4 w-4" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table2 className="h-4 w-4" />
                Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {isAdmin && (
            <Button onClick={() => navigate("/students/new")}>
              <UserPlus className="h-4 w-4" />
              Nuevo
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 pt-4">
          <CardTitle className="text-base">Buscar y filtrar</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterControls
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setPage(1);
            }}
            catalogs={catalogs}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <CardGridSkeleton count={8} />
      ) : currentPageItems.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onClear={() => {
            setFilters(clearFilters());
            setPage(1);
          }}
        />
      ) : view === "cards" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentPageItems.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onOpen={setSelected}
                onEdit={(s) => navigate(`/students/${s.id}/edit`)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={sorted.length}
            onPageChange={setPage}
          />
        </>
      ) : (
        <>
          <StudentTable
            students={currentPageItems}
            sort={sort}
            onSortChange={(s) => {
              setSort(s);
              setPage(1);
            }}
            onOpen={setSelected}
            onEdit={(s) => navigate(`/students/${s.id}/edit`)}
            onDelete={setToDelete}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={sorted.length}
            onPageChange={setPage}
          />
        </>
      )}

      <StudentModal student={selected} onClose={() => setSelected(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Eliminar estudiante"
        description={`¿Estás seguro de que deseas eliminar a "${toDelete?.full_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}