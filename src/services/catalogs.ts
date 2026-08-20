import { supabase } from "@/lib/supabase";
import { normalizeText } from "@/lib/utils";
import type {
  Career,
  CatalogImportRow,
  CatalogImportSummary,
  CatalogType,
  Location,
  University,
} from "@/types";

type CatalogRow = University | Career | Location;

const TABLE_BY_TYPE: Record<CatalogType, string> = {
  universities: "universities",
  careers: "careers",
  locations: "locations",
};

export async function listCatalog(
  type: CatalogType
): Promise<CatalogRow[]> {
  const table = TABLE_BY_TYPE[type];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CatalogRow[];
}

export async function createCatalogItem(
  type: CatalogType,
  name: string
): Promise<CatalogRow> {
  const table = TABLE_BY_TYPE[type];
  const { data, error } = await supabase
    .from(table)
    .insert({ name: name.trim() })
    .select("*")
    .single();

  if (error) throw error;
  return data as CatalogRow;
}

export async function updateCatalogItem(
  type: CatalogType,
  id: string,
  name: string
): Promise<void> {
  const table = TABLE_BY_TYPE[type];
  const { error } = await supabase
    .from(table)
    .update({ name: name.trim() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCatalogItem(
  type: CatalogType,
  id: string
): Promise<{ error: string | null }> {
  const table = TABLE_BY_TYPE[type];
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function checkCatalogNameExists(
  type: CatalogType,
  name: string,
  excludeId?: string
): Promise<boolean> {
  const table = TABLE_BY_TYPE[type];
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("name", name.trim())
    .neq("id", excludeId ?? "")
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/** Lee la primera columna de un CSV/XLSX/XLS y devuelve los nombres. */
export async function parseCatalogFile(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const names: string[] = [];
  for (const row of raw) {
    const value = Object.values(row)[0];
    const name = String(value ?? "").trim();
    if (name) names.push(name);
  }
  return names;
}

export async function validateCatalogImport(
  type: CatalogType,
  names: string[]
): Promise<{ results: CatalogImportRow[]; summary: CatalogImportSummary }> {
  const table = TABLE_BY_TYPE[type];
  const { data, error } = await supabase.from(table).select("name");
  if (error) throw error;

  const existing = new Set((data ?? []).map((r) => normalizeText(r.name)));
  const seen = new Map<string, number>();
  const results: CatalogImportRow[] = [];

  for (const name of names) {
    const key = normalizeText(name);
    const errors: string[] = [];

    if (existing.has(key)) {
      errors.push("Ya existe en el catálogo");
    }

    const firstIndex = seen.get(key);
    if (firstIndex !== undefined) {
      errors.push(`Duplicado en el archivo (fila ${firstIndex + 1})`);
    } else {
      seen.set(key, results.length);
    }

    results.push({
      name,
      status: errors.length > 0 ? "duplicate" : "valid",
      message: errors.length > 0 ? errors.join("; ") : undefined,
    });
  }

  const imported = results.filter((r) => r.status === "valid").length;

  return {
    results,
    summary: {
      total: results.length,
      imported,
      duplicates: results.length - imported,
    },
  };
}

export async function importCatalogItems(
  type: CatalogType,
  rows: CatalogImportRow[]
): Promise<{ imported: number; skipped: number }> {
  const table = TABLE_BY_TYPE[type];
  const valid = rows.filter((r) => r.status === "valid");

  if (valid.length === 0) {
    return { imported: 0, skipped: rows.length };
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(valid.map((r) => ({ name: r.name.trim() })), {
      onConflict: "name",
      ignoreDuplicates: true,
    })
    .select("name");

  if (error) throw error;

  const imported = data?.length ?? 0;
  return { imported, skipped: rows.length - imported };
}