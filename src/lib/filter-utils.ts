import type { StudentFilters } from "@/types";

export function hasActiveFilters(filters: StudentFilters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.universityId ||
      filters.careerId ||
      filters.locationId
  );
}

export function clearFilters(): StudentFilters {
  return {
    search: "",
    universityId: null,
    careerId: null,
    locationId: null,
  };
}