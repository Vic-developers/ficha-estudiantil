import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchStudentsByCatalogFilters,
  filterStudentsByText,
} from "@/services/students";
import { useDebounce } from "./useDebounce";
import type { StudentFilters, StudentItem } from "@/types";

interface Options {
  refreshKey?: number;
}

/**
 * Carga el directorio de estudiantes aplicando los filtros de catálogo en el
 * servidor y la búsqueda por texto en memoria (insensible a acentos).
 */
export function useStudentDirectory(
  catalogFilters: Pick<StudentFilters, "universityId" | "careerId" | "locationId">,
  search: string,
  options: Options = {}
) {
  const [all, setAll] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchStudentsByCatalogFilters(catalogFilters)
      .then((data) => {
        if (active) {
          setAll(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Error al cargar estudiantes");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [catalogFilters.universityId, catalogFilters.careerId, catalogFilters.locationId]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, options.refreshKey]);

  const students = useMemo(
    () => filterStudentsByText(all, debouncedSearch),
    [all, debouncedSearch]
  );

  return { students, loading, error, refresh: load };
}