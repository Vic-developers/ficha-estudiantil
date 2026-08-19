import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterControls } from "@/components/students/FilterControls";
import { EmptyState } from "@/components/students/EmptyState";
import { StudentPhoto } from "@/components/students/StudentPhoto";
import { useCatalogs } from "@/hooks/useCatalogs";
import { fetchStudentsByCatalogFilters } from "@/services/students";
import { clearFilters, hasActiveFilters } from "@/lib/filter-utils";
import type { StudentFilters, StudentItem } from "@/types";

export function ReportsPage() {
  const catalogs = useCatalogs();
  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    universityId: null,
    careerId: null,
    locationId: null,
  });
  const [result, setResult] = useState<StudentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "csv" | "pdf" | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchStudentsByCatalogFilters({
        universityId: filters.universityId,
        careerId: filters.careerId,
        locationId: filters.locationId,
      });
      const term = filters.search.trim().toLowerCase();
      const filtered = term
        ? data.filter((s) =>
            [s.full_name, s.enrollment_number, s.university?.name, s.career?.name, s.location?.name]
              .filter(Boolean)
              .some((v) => v!.toLowerCase().includes(term))
          )
        : data;

      setResult(filtered);
      toast.success(`Reporte generado: ${filtered.length} estudiantes.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const names = {
    university: catalogs.universities.find((u) => u.id === filters.universityId)?.name,
    career: catalogs.careers.find((c) => c.id === filters.careerId)?.name,
    location: catalogs.locations.find((l) => l.id === filters.locationId)?.name,
  };

  const handleExport = async (format: "excel" | "csv" | "pdf") => {
    if (!result) return;
    setExporting(format);
    try {
      const { exportToCsv, exportToExcel, exportToPdf } = await import(
        "@/services/export"
      );
      if (format === "excel") exportToExcel(result, filters, names);
      if (format === "csv") exportToCsv(result, filters, names);
      if (format === "pdf") await exportToPdf(result, filters, names);
      toast.success(`Exportación ${format.toUpperCase()} completada.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar.");
    } finally {
      setExporting(null);
    }
  };

  const hasActive = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Genera y exporta reportes según los filtros seleccionados.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configuración del reporte</CardTitle>
          <CardDescription>
            Selecciona los criterios. Solo se incluirán los estudiantes que cumplan
            todas las condiciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterControls
            filters={filters}
            onChange={setFilters}
            catalogs={catalogs}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generateReport()} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Generando…" : "Generar reporte"}
            </Button>
            {hasActive && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(clearFilters());
                  setResult(null);
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Resultado del reporte</CardTitle>
                <CardDescription className="mt-1">
                  <Badge variant="secondary" className="mr-1">
                    {result.length} estudiante{result.length !== 1 ? "s" : ""}
                  </Badge>
                  {hasActive && (
                    <Badge variant="outline">Filtros aplicados</Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.length === 0 || exporting !== null}
                  onClick={() => void handleExport("excel")}
                >
                  {exporting === "excel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.length === 0 || exporting !== null}
                  onClick={() => void handleExport("csv")}
                >
                  {exporting === "csv" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.length === 0 || exporting !== null}
                  onClick={() => void handleExport("pdf")}
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : result.length === 0 ? (
              <EmptyState
                compact
                hasFilters={hasActive}
                onClear={() => {
                  setFilters(clearFilters());
                  setResult(null);
                }}
                message="No se encontraron estudiantes con los criterios seleccionados."
              />
            ) : (
              <div className="max-h-[480px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-14">Foto</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Universidad</TableHead>
                      <TableHead>Carrera</TableHead>
                      <TableHead>Ubicación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <StudentPhoto
                            src={s.photo_url}
                            fullName={s.full_name}
                            className="h-10 w-8"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.enrollment_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.university?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.career?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.location?.name ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}