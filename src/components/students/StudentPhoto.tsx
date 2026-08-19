import { cn, initials } from "@/lib/utils";
import { User } from "lucide-react";

interface StudentPhotoProps {
  src?: string | null;
  fullName?: string;
  className?: string;
  rounded?: "full" | "lg";
}

/**
 * Muestra la foto del estudiante o un marcador de posición con sus iniciales.
 */
export function StudentPhoto({
  src,
  fullName = "",
  className,
  rounded = "lg",
}: StudentPhotoProps) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-lg";

  if (src) {
    return (
      <img
        src={src}
        alt={fullName || "Foto del estudiante"}
        className={cn("object-cover", radius, className)}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400",
        radius,
        className
      )}
      aria-label="Sin foto"
    >
      {fullName ? (
        <span className="select-none text-lg font-semibold">
          {initials(fullName)}
        </span>
      ) : (
        <User className="h-1/3 w-1/3" />
      )}
    </div>
  );
}