import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/students/ConfirmDialog";
import {
  importStudents,
  parseImportFile,
  validateImportRows,
} from "@/services/import";
import { downloadBlob } from "@/lib/utils";
import type { ImportRowResult, ImportSummary } from "@/types";

function statusBadge(status: ImportRowResult["status"]) {
  if (status === "valid") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Válido
      </Badge>
    );
  }
  if (status === "duplicate") {
    return (
      <Badge variant="warning">
        <AlertTriangle className="h-3 w-3" /> Duplicado
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3" /> Error
    </Badge>
  );
}

const TEMPLATE_CSV = [
  "Nombre,Universidad,Matrícula,Carrera,Ubicación",
  "Ana María Rodríguez,Universidad Nacional del Caribe,FE-2026-0101,Ingeniería de Software,Santo Domingo",
  "Luis Fernando Pérez,Universidad Adventista Dominicana,FE-2026-0102,Administración de Empresas,Santiago",
].join("\n");

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      toast.error("El archivo debe ser CSV, XLSX o XLS.");
      return;
    }

    setLoading(true);
    setFileName(file.name);
    setRows([]);
    setSummary(null);

    try {
      const parsed = await parseImportFile(file);
      const { results, summary } = await validateImportRows(parsed);
      setRows(results);
      setSummary(summary);
      toast.info(
        `${summary.total} registros analizados: ${summary.imported} válidos, ${summary.duplicates} duplicados, ${summary.errors} con errores.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo leer el archivo."
      );
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importStudents(rows);
      toast.success(
        `Importación completada: ${result.imported} importados, ${result.errors} errores.`
      );
      setConfirmOpen(false);
      setRows([]);
      setSummary(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, "plantilla-importacion.csv");
  };

  const validCount = rows.filter((r) => r.status === "valid").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Importar estudiantes</h1>
        <p className="text-sm text-muted-foreground">
          Carga un archivo CSV o Excel con las columnas: Nombre, Universidad,
          Matrícula, Carrera y Ubicación.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Seleccionar archivo</CardTitle>
          <CardDescription>
            Las universidades, carreras y ubicaciones deben existir en los
            catálogos. Descarga la plantilla de ejemplo para ver el formato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {loading ? "Analizando…" : fileName ? `Cambiar: ${fileName}` : "Elegir archivo"}
            </Button>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Upload className="h-4 w-4" />
              Descargar plantilla
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {summary.imported}
              </p>
              <p className="text-sm text-muted-foreground">Importados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {summary.duplicates}
              </p>
              <p className="text-sm text-muted-foreground">Duplicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-rose-600">{summary.errors}</p>
              <p className="text-sm text-muted-foreground">Con errores</p>
            </CardContent>
          </Card>
        </div>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Vista previa</CardTitle>
                <CardDescription>
                  Revisa los registros antes de importar.
                </CardDescription>
              </div>
              <Button
                disabled={validCount === 0 || importing}
                onClick={() => setConfirmOpen(true)}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? "Importando…" : `Importar ${validCount} válidos`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[440px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-28">Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Universidad</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Ubicación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="font-medium">{row.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.enrollment_number || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.university || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.career || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.location || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.some((r) => r.message) && (
              <div className="mt-4 space-y-1">
                {rows
                  .filter((r) => r.message)
                  .slice(0, 8)
                  .map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-medium">{r.full_name || r.enrollment_number}:</span>{" "}
                      {r.message}
                    </p>
                  ))}
                {rows.filter((r) => r.message).length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    …y {rows.filter((r) => r.message).length - 8} más.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar importación"
        description={`Se importarán ${validCount} estudiantes válidos. Los registros duplicados y con errores serán omitidos. ¿Deseas continuar?`}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        loading={importing}
        onConfirm={() => void handleImport()}
      />
    </div>
  );
}