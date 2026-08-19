import jsPDF from "jspdf";
import { buildFileName, formatDate } from "@/lib/utils";
import type { StudentItem } from "@/types";

/** Genera una ficha PDF individual con diseño institucional. */
export async function exportSingleStudentPdf(student: StudentItem): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Encabezado
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FICHA ESTUDIANTIL", margin, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Fecha de generación: ${formatDate(new Date().toISOString())}`,
    pageWidth - margin,
    13,
    { align: "right" }
  );
  doc.text("Matrícula: " + student.enrollment_number, pageWidth - margin, 19, {
    align: "right",
  });

  let y = 42;
  const rightX = pageWidth - margin;
  const labelWidth = 52;
  const labelX = margin;
  const valueX = margin + labelWidth;
  const rowGap = 22;

  // Foto
  let hasPhoto = false;
  if (student.photo_url) {
    try {
      const response = await fetch(student.photo_url);
      if (response.ok) {
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(dataUrl, "JPEG", rightX - 64, y, 50, 62);
        hasPhoto = true;
      }
    } catch {
      hasPhoto = false;
    }
  }

  if (!hasPhoto) {
    doc.setFillColor(226, 232, 240);
    doc.rect(rightX - 64, y, 50, 62, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Sin foto", rightX - 39, y + 31, { align: "center" });
  }

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, rightX - 76, y);

  y += 12;

  const rows: Array<[string, string]> = [
    ["Nombre completo", student.full_name],
    ["Universidad", student.university?.name ?? "—"],
    ["Carrera", student.career?.name ?? "—"],
    ["Ubicación", student.location?.name ?? "—"],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  for (const [label, value] of rows) {
    doc.text(label, labelX, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(value, pageWidth - valueX - 90);
    doc.text(wrapped, valueX, y);
    y += Math.max(rowGap, 10 * wrapped.length + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 90, 90);
  }

  // Pie de página
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Documento generado por Ficha Estudiantil · Página 1",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save(buildFileName(`ficha-${student.enrollment_number}`, "pdf"));
}