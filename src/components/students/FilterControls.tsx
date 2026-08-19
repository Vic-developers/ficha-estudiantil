import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Catalogs } from "@/hooks/useCatalogs";
import type { StudentFilters } from "@/types";
import { hasActiveFilters } from "@/lib/filter-utils";

interface FilterControlsProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  catalogs: Catalogs;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export function FilterControls({
  filters,
  onChange,
  catalogs,
  showSearch = true,
  searchPlaceholder = "Buscar estudiante, matrícula, universidad…",
}: FilterControlsProps) {
  const set = (patch: Partial<StudentFilters>) =>
    onChange({ ...filters, ...patch });

  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder={searchPlaceholder}
            className="h-11 pl-10 pr-10"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.universityId ?? "all"}
          onValueChange={(v) => set({ universityId: v === "all" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Universidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las universidades</SelectItem>
            {catalogs.universities.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.careerId ?? "all"}
          onValueChange={(v) => set({ careerId: v === "all" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las carreras</SelectItem>
            {catalogs.careers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.locationId ?? "all"}
          onValueChange={(v) => set({ locationId: v === "all" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ubicaciones</SelectItem>
            {catalogs.locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              onChange({
                search: "",
                universityId: null,
                careerId: null,
                locationId: null,
              })
            }
            disabled={!active}
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}