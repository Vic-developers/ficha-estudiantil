import { SearchX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  message?: string;
  hasFilters?: boolean;
  onClear?: () => void;
  compact?: boolean;
}

export function EmptyState({
  message = "No encontramos estudiantes con los filtros seleccionados.",
  hasFilters = false,
  onClear,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center ${
        compact ? "py-10" : "py-20"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        {hasFilters ? (
          <SearchX className="h-6 w-6 text-muted-foreground" />
        ) : (
          <Users className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {hasFilters && onClear && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}