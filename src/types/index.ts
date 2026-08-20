export type UserRole = "admin" | "consulta";

export interface University {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  photo_url: string | null;
  full_name: string;
  university_id: string;
  enrollment_number: string;
  career_id: string;
  location_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentRelations {
  university: { id: string; name: string } | null;
  career: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
}

/** Estudiante con las relaciones expandidas (join). */
export type StudentItem = Student & StudentRelations;

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Filtros combinables usados en dashboard, listado y reportes. */
export interface StudentFilters {
  search: string;
  universityId: string | null;
  careerId: string | null;
  locationId: string | null;
}

export const emptyFilters: StudentFilters = {
  search: "",
  universityId: null,
  careerId: null,
  locationId: null,
};

export interface StudentStats {
  totalStudents: number;
  totalUniversities: number;
  totalCareers: number;
  totalLocations: number;
}

export interface StudentInput {
  full_name: string;
  university_id: string;
  enrollment_number: string;
  career_id: string;
  location_id: string;
  photo_url: string | null;
}

export interface ImportedRow {
  full_name: string;
  university: string;
  enrollment_number: string;
  career: string;
  location: string;
}

export type ImportRowStatus = "valid" | "duplicate" | "error";

export interface ImportRowResult extends ImportedRow {
  status: ImportRowStatus;
  message?: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}

export type CatalogType = "universities" | "careers" | "locations";

export interface CatalogImportRow {
  name: string;
  status: ImportRowStatus;
  message?: string;
}

export interface CatalogImportSummary {
  total: number;
  imported: number;
  duplicates: number;
}