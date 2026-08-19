import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeText } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  id: string;
  name: string;
}

interface ComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector con búsqueda para catálogos (universidades, carreras, ubicaciones).
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Buscar…",
  emptyText = "No se encontraron resultados.",
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const term = normalizeText(search.trim());
    if (!term) return options;
    return options.filter((o) => normalizeText(o.name).includes(term));
  }, [options, search]);

  const handleSelect = (id: string) => {
    onChange(id === value ? null : id);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          "h-9 w-full justify-between font-normal",
          !value && "text-muted-foreground",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">{placeholder}</DialogTitle>
          </DialogHeader>

          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>

          <div className="scrollbar-thin max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                    option.id === value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === value && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
              }}
            >
              <X className="h-4 w-4" />
              Limpiar selección
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}