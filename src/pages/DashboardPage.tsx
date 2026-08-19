import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  FileBarChart,
  GraduationCap,
  MapPin,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterControls } from "@/components/students/FilterControls";
import { StudentCard } from "@/components/students/StudentCard";
import { StudentModal } from "@/components/students/StudentModal";
import { EmptyState } from "@/components/students/EmptyState";
import { Pagination } from "@/components/students/Pagination";
import { useStudentDirectory } from "@/hooks/useStudentDirectory";
import { useCatalogs } from "@/hooks/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchStudentStats,
  fetchStudentsByCareer,
  fetchStudentsByLocation,
  fetchStudentsByUniversity,
  type ChartDatum,
} from "@/services/students";
import { clearFilters, hasActiveFilters } from "@/lib/filter-utils";
import { paginate } from "@/lib/student-list";
import type { StudentFilters, StudentItem, StudentStats } from "@/types";

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="mb-1 h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold leading-none tracking-tight">
              {value.toLocaleString("es-DO")}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  description,
  data,
  loading,
}: {
  title: string;
  description: string;
  data: ChartDatum[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin datos
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((d) => (
              <div key={d.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="max-w-[70%] truncate">{d.name}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DonutChartCard({
  title,
  description,
  data,
  loading,
}: {
  title: string;
  description: string;
  data: ChartDatum[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin datos
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="font-medium">
                  {Math.round((d.count / total) * 100)}%
                </span>
                <span className="w-8 text-right text-muted-foreground">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const catalogs = useCatalogs();

  const [stats, setStats] = useState<StudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [byUniversity, setByUniversity] = useState<ChartDatum[]>([]);
  const [byCareer, setByCareer] = useState<ChartDatum[]>([]);
  const [byLocation, setByLocation] = useState<ChartDatum[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    universityId: null,
    careerId: null,
    locationId: null,
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentItem | null>(null);

  const { students, loading, error } = useStudentDirectory(
    {
      universityId: filters.universityId,
      careerId: filters.careerId,
      locationId: filters.locationId,
    },
    filters.search
  );

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    Promise.all([
      fetchStudentStats(),
      fetchStudentsByUniversity(),
      fetchStudentsByCareer(),
      fetchStudentsByLocation(),
    ])
      .then(([s, u, c, l]) => {
        setStats(s);
        setByUniversity(u);
        setByCareer(c);
        setByLocation(l);
        setStatsLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Error al cargar estadísticas");
        setStatsLoading(false);
      })
      .finally(() => setChartsLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const hasFilters = hasActiveFilters(filters);
  const totalPages = Math.max(1, Math.ceil(students.length / 6));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const currentPageItems = useMemo(() => paginate(students, page, 6), [students, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Administra y consulta la información de tus estudiantes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button onClick={() => navigate("/students/new")}>
              <Plus className="h-4 w-4" />
              Nuevo estudiante
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/import")}>
              <Upload className="h-4 w-4" />
              Importar estudiantes
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <FileBarChart className="h-4 w-4" />
            Generar reporte
          </Button>
          <Button variant="outline" onClick={() => navigate("/students")}>
            <Users className="h-4 w-4" />
            Ver estudiantes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Estudiantes"
          value={stats?.totalStudents ?? 0}
          icon={GraduationCap}
          loading={statsLoading}
        />
        <StatCard
          label="Universidades"
          value={stats?.totalUniversities ?? 0}
          icon={Building2}
          loading={statsLoading}
        />
        <StatCard
          label="Carreras"
          value={stats?.totalCareers ?? 0}
          icon={BookOpen}
          loading={statsLoading}
        />
        <StatCard
          label="Ubicaciones"
          value={stats?.totalLocations ?? 0}
          icon={MapPin}
          loading={statsLoading}
        />
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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Estudiantes
          </h2>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : currentPageItems.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={() => setFilters(clearFilters())}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              totalItems={students.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Estadísticas
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarChartCard
            title="Estudiantes por universidad"
            description="Distribución en las universidades"
            data={byUniversity}
            loading={chartsLoading}
          />
          <BarChartCard
            title="Estudiantes por carrera"
            description="Distribución en las carreras"
            data={byCareer}
            loading={chartsLoading}
          />
          <DonutChartCard
            title="Estudiantes por ubicación"
            description="Porcentaje por ubicación"
            data={byLocation}
            loading={chartsLoading}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Acciones rápidas</CardTitle>
              <CardDescription>Atajos para tareas frecuentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/students")}
              >
                <Users className="h-4 w-4" />
                Ver todos los estudiantes
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/import")}
                >
                  <Upload className="h-4 w-4" />
                  Importar estudiantes desde archivo
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/reports")}
              >
                <FileBarChart className="h-4 w-4" />
                Generar reporte y exportar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentModal student={selected} onClose={() => setSelected(null)} />
    </div>
  );
}