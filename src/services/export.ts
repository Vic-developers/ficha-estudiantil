import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildFileName, downloadBlob, formatDate } from "@/lib/utils";
import type { StudentFilters, StudentItem } from "@/types";

const HEADERS = ["Foto", "Nombre", "Matrícula", "Universidad", "Carrera", "Ubicación"];

function rowsForExport(students: StudentItem[]): (string | number)[][] {
  return students.map((s) => [
    s.photo_url ?? "",
    s.full_name,
    s.enrollment_number,
    s.university?.name ?? "",
    s.career?.name ?? "",
    s.location?.name ?? "",
  ]);
}

function filtersSummary(filters: StudentFilters, names: {
  university?: string;
  career?: string;
  location?: string;
}): string {
  const parts: string[] = [];
  if (filters.search.trim()) parts.push(`Búsqueda: "${filters.search.trim()}"`);
  if (filters.universityId && names.university) parts.push(`Universidad: ${names.university}`);
  if (filters.careerId && names.career) parts.push(`Carrera: ${names.career}`);
  if (filters.locationId && names.location) parts.push(`Ubicación: ${names.location}`);
  return parts.length ? parts.join(" · ") : "Todos los estudiantes";
}

export function exportToCsv(students: StudentItem[], filters: StudentFilters, names: {
  university?: string;
  career?: string;
  location?: string;
}): void {
  const metaRows: string[][] = [
    ["Reporte Ficha Estudiantil"],
    [`Generado el: ${formatDate(new Date().toISOString())}`],
    [`Filtros: ${filtersSummary(filters, names)}`],
    [`Cantidad de estudiantes: ${students.length}`],
    [],
  ];
  const rows = [...metaRows, HEADERS, ...rowsForExport(students)];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (/[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, buildFileName("ficha-estudiantil", "csv"));
}

export function exportToExcel(students: StudentItem[], filters: StudentFilters, names: {
  university?: string;
  career?: string;
  location?: string;
}): void {
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rowsForExport(students)]);
  worksheet["!cols"] = [
    { wch: 40 },
    { wch: 32 },
    { wch: 16 },
    { wch: 34 },
    { wch: 28 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");

  const meta = XLSX.utils.aoa_to_sheet([
    ["Reporte Ficha Estudiantil"],
    [`Generado el: ${formatDate(new Date().toISOString())}`],
    [`Filtros: ${filtersSummary(filters, names)}`],
    [`Cantidad: ${students.length}`],
    [],
  ]);
  XLSX.utils.book_append_sheet(workbook, meta, "Resumen");

  XLSX.writeFile(workbook, buildFileName("ficha-estudiantil", "xlsx"));
}

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportToPdf(
  students: StudentItem[],
  filters: StudentFilters,
  names: { university?: string; career?: string; location?: string }
): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Fotos precargadas (falla con gracia si no se puede leer la imagen).
  const photoCache = new Map<string, string | null>();
  await Promise.all(
    students.map(async (s) => {
      if (s.photo_url) {
        photoCache.set(s.id, await imageToDataUrl(s.photo_url));
      }
    })
  );

  let pageNumber = 1;

  autoTable(doc, {
    head: [["Foto", "Nombre", "Matrícula", "Universidad", "Carrera", "Ubicación"]],
    body: students.map((s) => [
      "",
      s.full_name,
      s.enrollment_number,
      s.university?.name ?? "",
      s.career?.name ?? "",
      s.location?.name ?? "",
    ]),
    startY: 34,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      2: { cellWidth: 26 },
      3: { cellWidth: 56 },
      4: { cellWidth: 52 },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const student = students[data.row.index];
        const photoUrl = student ? photoCache.get(student.id) : null;
        const x = data.cell.x + 1;
        const y = data.cell.y + 1;
        const size = Math.min(data.cell.height - 2, 14);
        if (photoUrl) {
          try {
            doc.addImage(photoUrl, "JPEG", x, y, size, size);
          } catch {
            // imagen inválida: se omite
          }
        } else {
          doc.setFillColor(226, 232, 240);
          doc.rect(x, y, size, size, "F");
        }
      }
    },
    didDrawPage: () => {
      // Encabezado institucional
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 26, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("FICHA ESTUDIANTIL", 14, 11);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha de generación: ${formatDate(new Date().toISOString())}`,
        pageWidth - 14,
        10,
        { align: "right" }
      );

      // Línea de filtros
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "bold");
      doc.text("Filtros:", 14, 30);
      doc.setFont("helvetica", "normal");
      doc.text(filtersSummary(filters, names), 26, 30);
      doc.setFont("helvetica", "bold");
      doc.text(`Cantidad de estudiantes: ${students.length}`, pageWidth - 14, 30, {
        align: "right",
      });

      // Pie de página con numeración
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Página ${pageNumber}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      pageNumber += 1;
    },
  });

  doc.save(buildFileName("ficha-estudiantil", "pdf"));
}