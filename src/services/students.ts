import { supabase } from "@/lib/supabase";
import { normalizeText } from "@/lib/utils";
import type {
  StudentFilters,
  StudentInput,
  StudentItem,
  StudentStats,
} from "@/types";
import { deletePhoto } from "./storage";

const STUDENT_SELECT =
  "*, university:universities(id, name), career:careers(id, name), location:locations(id, name)";

/**
 * Obtiene los estudiantes aplicando los filtros de catálogo (universidad,
 * carrera, ubicación) directamente en la base de datos. La búsqueda por texto
 * se aplica en memoria para soportar búsquedas sin acentos.
 */
export async function fetchStudentsByCatalogFilters(
  filters: Pick<StudentFilters, "universityId" | "careerId" | "locationId">
): Promise<StudentItem[]> {
  let query = supabase
    .from("students")
    .select(STUDENT_SELECT)
    .order("full_name", { ascending: true });

  if (filters.universityId) {
    query = query.eq("university_id", filters.universityId);
  }
  if (filters.careerId) {
    query = query.eq("career_id", filters.careerId);
  }
  if (filters.locationId) {
    query = query.eq("location_id", filters.locationId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as StudentItem[];
}

/** Aplica búsqueda por texto (nombre, matrícula, universidad, carrera, ubicación) sin acentos. */
export function filterStudentsByText(
  students: StudentItem[],
  search: string
): StudentItem[] {
  const term = normalizeText(search.trim());
  if (!term) return students;

  return students.filter((s) => {
    const haystack = normalizeText(
      [
        s.full_name,
        s.enrollment_number,
        s.university?.name ?? "",
        s.career?.name ?? "",
        s.location?.name ?? "",
      ].join(" ")
    );
    return haystack.includes(term);
  });
}

export async function fetchStudent(id: string): Promise<StudentItem | null> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as StudentItem | null) ?? null;
}

export async function checkEnrollmentExists(
  enrollmentNumber: string,
  excludeId?: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("enrollment_number", enrollmentNumber)
    .neq("id", excludeId ?? "")
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

export async function createStudent(input: StudentInput): Promise<StudentItem> {
  const { data, error } = await supabase
    .from("students")
    .insert({
      full_name: input.full_name.trim(),
      university_id: input.university_id,
      enrollment_number: input.enrollment_number.trim(),
      career_id: input.career_id,
      location_id: input.location_id,
      photo_url: input.photo_url,
    })
    .select(STUDENT_SELECT)
    .single();

  if (error) throw error;
  return data as StudentItem;
}

export async function updateStudent(
  id: string,
  input: StudentInput
): Promise<StudentItem> {
  const { data, error } = await supabase
    .from("students")
    .update({
      full_name: input.full_name.trim(),
      university_id: input.university_id,
      enrollment_number: input.enrollment_number.trim(),
      career_id: input.career_id,
      location_id: input.location_id,
      photo_url: input.photo_url,
    })
    .eq("id", id)
    .select(STUDENT_SELECT)
    .single();

  if (error) throw error;
  return data as StudentItem;
}

export async function deleteStudent(student: StudentItem): Promise<void> {
  const { error } = await supabase.from("students").delete().eq("id", student.id);
  if (error) throw error;

  if (student.photo_url) {
    await deletePhoto(student.photo_url).catch(() => {
      // La foto no impide la eliminación del registro.
    });
  }
}

export async function fetchStudentStats(): Promise<StudentStats> {
  const [students, universities, careers, locations] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("universities")
      .select("*", { count: "exact", head: true }),
    supabase.from("careers").select("*", { count: "exact", head: true }),
    supabase.from("locations").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalStudents: students.count ?? 0,
    totalUniversities: universities.count ?? 0,
    totalCareers: careers.count ?? 0,
    totalLocations: locations.count ?? 0,
  };
}

export interface ChartDatum {
  name: string;
  count: number;
}

export async function fetchStudentsByUniversity(): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc("students_by_university");
  if (error) throw error;
  return (data ?? []) as ChartDatum[];
}

export async function fetchStudentsByCareer(): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc("students_by_career");
  if (error) throw error;
  return (data ?? []) as ChartDatum[];
}

export async function fetchStudentsByLocation(): Promise<ChartDatum[]> {
  const { data, error } = await supabase.rpc("students_by_location");
  if (error) throw error;
  return (data ?? []) as ChartDatum[];
}