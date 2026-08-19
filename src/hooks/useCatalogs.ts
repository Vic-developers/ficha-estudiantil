import { useCallback, useEffect, useState } from "react";
import {
  listCatalog,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/services/catalogs";
import type { Career, CatalogType, Location, University } from "@/types";

export interface Catalogs {
  universities: University[];
  careers: Career[];
  locations: Location[];
  loading: boolean;
  refresh: () => Promise<void>;
  createItem: (type: CatalogType, name: string) => Promise<void>;
  updateItem: (type: CatalogType, id: string, name: string) => Promise<void>;
  deleteItem: (
    type: CatalogType,
    id: string
  ) => Promise<{ error: string | null }>;
}

export function useCatalogs(): Catalogs {
  const [universities, setUniversities] = useState<University[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [u, c, l] = await Promise.all([
      listCatalog("universities"),
      listCatalog("careers"),
      listCatalog("locations"),
    ]);
    setUniversities(u as University[]);
    setCareers(c as Career[]);
    setLocations(l as Location[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createItem = useCallback(
    async (type: CatalogType, name: string) => {
      await createCatalogItem(type, name);
      await refresh();
    },
    [refresh]
  );

  const updateItem = useCallback(
    async (type: CatalogType, id: string, name: string) => {
      await updateCatalogItem(type, id, name);
      await refresh();
    },
    [refresh]
  );

  const deleteItem = useCallback(
    async (type: CatalogType, id: string) => {
      const result = await deleteCatalogItem(type, id);
      if (!result.error) await refresh();
      return result;
    },
    [refresh]
  );

  return {
    universities,
    careers,
    locations,
    loading,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}