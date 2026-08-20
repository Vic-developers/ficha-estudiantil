import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  importCatalogItems,
  parseCatalogFile,
  validateCatalogImport,
} from "@/services/catalogs";
import { downloadBlob } from "@/lib/utils";
import type { CatalogImportRow, CatalogImportSummary, CatalogType } from "@/types";

const SINGULAR: Record<CatalogType, string> = {
  universities: "universidad",
  careers: "carrera",
  locations: "ubicación",
};

const TEMPLATE_EXAMPLES: Record<CatalogType, string[]> = {
  universities: [
    "Universidad Nacional del Caribe",
    "Universidad Adventista Dominicana",
    "Instituto Tecnológico del Cibao",
  ],
  careers: [
    "Ingeniería de Software",
    "Administración de Empresas",
    "Contabilidad",
  ],
  locations: [
    "Santo Domingo",
    "Santiago",
    "La Vega",
  ],
};

interface ImportCatalogDialogProps {
  type: CatalogType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportCatalogDialog({
  type,
  open,
  onOpenChange,
  onImported,
}: ImportCatalogDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CatalogImportRow[]>([]);
  const [summary, setSummary] = useState<CatalogImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFileName(null);
      setRows([]);
      setSummary(null);
      setConfirmOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
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
        const names = await parseCatalogFile(file);
        if (names.length === 0) {
          toast.error("El archivo no contiene datos.");
          setFileName(null);
          return;
        }
        const { results, summary: resultSummary } = await validateCatalogImport(
          type,
          names
        );
        setRows(results);
        setSummary(resultSummary);
        toast.info(
          `${resultSummary.total} registros analizados: ${resultSummary.imported} nuevos, ${resultSummary.duplicates} ya existentes/duplicados.`
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "No se pudo leer el archivo."
        );
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await importCatalogItems(type, rows);
      toast.success(
        `Importación completada: ${result.imported} ${result.imported === 1 ? SINGULAR[type] : `${SINGULAR[type]}s`} importados, ${result.skipped} omitidos.`
      );
      onImported();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const content = `Nombre\n${TEMPLATE_EXAMPLES[type].join("\n")}`;
    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, `plantilla-${type}.csv`);
  };

  const validCount = rows.filter((r) => r.status === "valid").length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar {SINGULAR[type]}s por archivo</DialogTitle>
            <DialogDescription>
              Carga un archivo CSV (o Excel) con una columna por registro. La
              primera columna se toma como nombre. Descarga la plantilla para
              ver el formato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                {loading
                  ? "Analizando…"
                  : fileName
                    ? `Cambiar: ${fileName}`
                    : "Elegir archivo"}
              </Button>
              <Button variant="ghost" onClick={downloadTemplate}>
                <Upload className="h-4 w-4" />
                Descargar plantilla
              </Button>
            </div>

            {summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{summary.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {summary.imported}
                  </p>
                  <p className="text-sm text-muted-foreground">Nuevos</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {summary.duplicates}
                  </p>
                  <p className="text-sm text-muted-foreground">Omitidos</p>
                </div>
              </div>
            )}

            {rows.length > 0 && (
              <div className="max-h-[260px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-24">Estado</TableHead>
                      <TableHead>Nombre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row.status === "valid" ? (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3" /> Nuevo
                            </Badge>
                          ) : row.status === "duplicate" ? (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3" /> Omitido
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3" /> Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {rows.some((r) => r.message) && (
              <div className="space-y-1">
                {rows
                  .filter((r) => r.message)
                  .slice(0, 5)
                  .map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-medium">{r.name}:</span> {r.message}
                    </p>
                  ))}
                {rows.filter((r) => r.message).length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    …y {rows.filter((r) => r.message).length - 5} más.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button
              disabled={validCount === 0 || importing}
              onClick={() => setConfirmOpen(true)}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? "Importando…" : `Importar ${validCount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar importación</DialogTitle>
            <DialogDescription>
              Se importarán {validCount} {validCount === 1 ? SINGULAR[type] : `${SINGULAR[type]}s`}. Los registros ya existentes o duplicados serán omitidos. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={importing}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleImport()} disabled={importing}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}