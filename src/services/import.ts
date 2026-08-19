import { supabase } from "@/lib/supabase";
import { normalizeText } from "@/lib/utils";
import type {
  ImportRowResult,
  ImportRowStatus,
  ImportSummary,
  ImportedRow,
  StudentInput,
} from "@/types";

const REQUIRED_KEYS: Array<{ key: string; label: string }> = [
  { key: "nombre", label: "Nombre" },
  { key: "universidad", label: "Universidad" },
  { key: "matricula", label: "Matrícula" },
  { key: "carrera", label: "Carrera" },
  { key: "ubicacion", label: "Ubicación" },
];

const HEADER_ALIASES: Record<string, string> = {
  nombre: "nombre",
  "nombre completo": "nombre",
  nombres: "nombre",
  estudiante: "nombre",
  universidad: "universidad",
  institucion: "universidad",
  matricula: "matricula",
  "no. matricula": "matricula",
  matrícula: "matricula",
  "numero de matricula": "matricula",
  carrera: "carrera",
  "carrera profesional": "carrera",
  programa: "carrera",
  ubicacion: "ubicacion",
  "ubicación": "ubicacion",
  ciudad: "ubicacion",
  provincia: "ubicacion",
  localidad: "ubicacion",
  lugar: "ubicacion",
};

export async function parseImportFile(file: File): Promise<ImportedRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return raw.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = normalizeText(String(key)).trim();
      const alias = HEADER_ALIASES[normalizedKey];
      if (alias && !normalized[alias]) {
        normalized[alias] = String(value ?? "").trim();
      }
    }

    return {
      full_name: normalized["nombre"] ?? "",
      university: normalized["universidad"] ?? "",
      enrollment_number: normalized["matricula"] ?? "",
      career: normalized["carrera"] ?? "",
      location: normalized["ubicacion"] ?? "",
    };
  });
}

export async function validateImportRows(
  rows: ImportedRow[]
): Promise<{ results: ImportRowResult[]; summary: ImportSummary }> {
  const [universities, careers, locations, existing] = await Promise.all([
    supabase.from("universities").select("id, name"),
    supabase.from("careers").select("id, name"),
    supabase.from("locations").select("id, name"),
    supabase.from("students").select("enrollment_number"),
  ]);

  if (universities.error) throw universities.error;
  if (careers.error) throw careers.error;
  if (locations.error) throw locations.error;
  if (existing.error) throw existing.error;

  const uniMap = new Map(
    (universities.data ?? []).map((u) => [normalizeText(u.name), u])
  );
  const careerMap = new Map(
    (careers.data ?? []).map((c) => [normalizeText(c.name), c])
  );
  const locMap = new Map(
    (locations.data ?? []).map((l) => [normalizeText(l.name), l])
  );
  const existingMatriculas = new Set(
    (existing.data ?? []).map((s) => normalizeText(s.enrollment_number))
  );

  const seenInFile = new Map<string, number>();
  const results: ImportRowResult[] = [];

  for (const row of rows) {
    const errors: string[] = [];

    for (const { key, label } of REQUIRED_KEYS) {
      const value = (row as unknown as Record<string, string>)[key];
      if (!value || !value.trim()) {
        errors.push(`${label} es obligatorio`);
      }
    }

    const matriculaKey = normalizeText(row.enrollment_number);

    if (matriculaKey) {
      const firstIndex = seenInFile.get(matriculaKey);
      if (firstIndex !== undefined) {
        errors.push(`Matrícula duplicada (coincide con la fila ${firstIndex + 1})`);
      } else {
        seenInFile.set(matriculaKey, results.length);
      }

      if (existingMatriculas.has(matriculaKey)) {
        errors.push("Matrícula ya registrada en el sistema");
      }
    }

    if (row.university && !uniMap.has(normalizeText(row.university))) {
      errors.push(`Universidad no existe en el catálogo: "${row.university}"`);
    }
    if (row.career && !careerMap.has(normalizeText(row.career))) {
      errors.push(`Carrera no existe en el catálogo: "${row.career}"`);
    }
    if (row.location && !locMap.has(normalizeText(row.location))) {
      errors.push(`Ubicación no existe en el catálogo: "${row.location}"`);
    }

    let status: ImportRowStatus = "valid";
    let message: string | undefined;

    if (errors.length > 0) {
      status = matriculaKey &&
        (existingMatriculas.has(matriculaKey) ||
          seenInFile.get(matriculaKey) !== results.length)
        ? "duplicate"
        : "error";
      message = errors.join("; ");
    }

    results.push({
      ...row,
      status,
      message,
    });
  }

  const imported = results.filter((r) => r.status === "valid").length;
  const duplicates = results.filter((r) => r.status === "duplicate").length;
  const errors = results.filter((r) => r.status === "error").length;

  return {
    results,
    summary: {
      total: results.length,
      imported,
      duplicates,
      errors,
    },
  };
}

export async function importStudents(
  rows: ImportRowResult[]
): Promise<{ imported: number; errors: number }> {
  const validRows = rows.filter((r) => r.status === "valid");

  const [universities, careers, locations] = await Promise.all([
    supabase.from("universities").select("id, name"),
    supabase.from("careers").select("id, name"),
    supabase.from("locations").select("id, name"),
  ]);

  const uniMap = new Map(
    (universities.data ?? []).map((u) => [normalizeText(u.name), u.id])
  );
  const careerMap = new Map(
    (careers.data ?? []).map((c) => [normalizeText(c.name), c.id])
  );
  const locMap = new Map(
    (locations.data ?? []).map((l) => [normalizeText(l.name), l.id])
  );

  let imported = 0;
  let errors = 0;

  for (const row of validRows) {
    const input: StudentInput = {
      full_name: row.full_name,
      enrollment_number: row.enrollment_number,
      university_id: uniMap.get(normalizeText(row.university)) ?? "",
      career_id: careerMap.get(normalizeText(row.career)) ?? "",
      location_id: locMap.get(normalizeText(row.location)) ?? "",
      photo_url: null,
    };

    if (
      !input.university_id ||
      !input.career_id ||
      !input.location_id ||
      !input.full_name ||
      !input.enrollment_number
    ) {
      errors += 1;
      continue;
    }

    const { error } = await supabase.from("students").insert({
      full_name: input.full_name,
      enrollment_number: input.enrollment_number,
      university_id: input.university_id,
      career_id: input.career_id,
      location_id: input.location_id,
      photo_url: null,
    });

    if (error) errors += 1;
    else imported += 1;
  }

  return { imported, errors };
}