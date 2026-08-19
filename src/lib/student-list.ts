import type { StudentItem } from "@/types";
import type { SortState } from "@/components/students/StudentTable";

export function sortStudents(
  students: StudentItem[],
  sort: SortState
): StudentItem[] {
  const dir = sort.direction === "asc" ? 1 : -1;

  return [...students].sort((a, b) => {
    let va: string;
    let vb: string;

    switch (sort.key) {
      case "enrollment_number":
        va = a.enrollment_number;
        vb = b.enrollment_number;
        break;
      case "university":
        va = a.university?.name ?? "";
        vb = b.university?.name ?? "";
        break;
      case "career":
        va = a.career?.name ?? "";
        vb = b.career?.name ?? "";
        break;
      case "location":
        va = a.location?.name ?? "";
        vb = b.location?.name ?? "";
        break;
      default:
        va = a.full_name;
        vb = b.full_name;
    }

    return va.localeCompare(vb, "es", { sensitivity: "base" }) * dir;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}