import { supabase } from "@/lib/supabase";
import type { Career, CatalogType, Location, University } from "@/types";

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