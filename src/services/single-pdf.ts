import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { buildFileName, formatDate } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { StudentItem } from "@/types";

const PRIMARY: [number, number, number] = [30, 64, 175];
const ACCENT: [number, number, number] = [212, 175, 55];

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;
    if (dataUrl.startsWith("data:image/webp")) {
      return await webpToJpeg(dataUrl);
    }
    return dataUrl;
  } catch {
    return null;
  }
}

function imageFormat(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return "JPEG";
}

async function webpToJpeg(dataUrl: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => reject(new Error("invalid image"));
    img.src = dataUrl;
  });
}

/** Genera una ficha PDF individual con diseño institucional. */
export async function exportSingleStudentPdf(student: StudentItem): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;

  const photo = student.photo_url ? await imageToDataUrl(student.photo_url) : null;

  // ------------------------------------------------------------
  // Encabezado institucional
  // ------------------------------------------------------------
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text(siteConfig.institution.toUpperCase(), margin, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Ficha de Estudiante", margin, 24);

  doc.setFontSize(9);
  doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, pageW - margin, 14, {
    align: "right",
  });
  doc.text(`Matrícula: ${student.enrollment_number}`, pageW - margin, 21, {
    align: "right",
  });

  doc.setFillColor(...ACCENT);
  doc.rect(0, 32, pageW, 1.5, "F");

  // ------------------------------------------------------------
  // Nombre del estudiante
  // ------------------------------------------------------------
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(student.full_name, margin, 45, { maxWidth: pageW - margin * 2 });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, 49, pageW - margin, 49);

  // ------------------------------------------------------------
  // Foto
  // ------------------------------------------------------------
  const photoW = 60;
  const photoH = 78;
  const photoX = margin;
  const photoY = 58;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2);

  if (photo) {
    try {
      const props = doc.getImageProperties(photo);
      const ratio = props.width / props.height;
      let w = photoW - 4;
      let h = w / ratio;
      if (h > photoH - 4) {
        h = photoH - 4;
        w = h * ratio;
      }
      const x = photoX + (photoW - w) / 2;
      const y = photoY + (photoH - h) / 2;
      doc.addImage(photo, imageFormat(photo), x, y, w, h);
    } catch {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(photoX + 1, photoY + 1, photoW - 2, photoH - 2, 1.5, 1.5, "F");
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(photoX + 1, photoY + 1, photoW - 2, photoH - 2, 1.5, 1.5, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Sin fotografía",
      photoX + photoW / 2,
      photoY + photoH / 2,
      { align: "center" }
    );
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Fotografía", photoX + photoW / 2, photoY + photoH + 6, {
    align: "center",
  });

  // ------------------------------------------------------------
  // Datos de la ficha en tabla
  // ------------------------------------------------------------
  const tableX = margin + photoW + 12;

  autoTable(doc, {
    startY: photoY + 2,
    margin: { left: tableX, right: margin },
    theme: "plain",
    body: [
      ["Nombre completo", student.full_name],
      ["Matrícula", student.enrollment_number],
      ["Universidad", student.university?.name ?? "—"],
      ["Carrera", student.career?.name ?? "—"],
      ["Ubicación", student.location?.name ?? "—"],
    ],
    styles: {
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      valign: "middle",
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: {
        cellWidth: 45,
        fillColor: [241, 245, 249],
        fontStyle: "bold",
        fontSize: 9,
        textColor: [71, 85, 105],
      },
      1: {
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
    },
  });

  // ------------------------------------------------------------
  // Pie de página
  // ------------------------------------------------------------
  const footerY = pageH - 14;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${siteConfig.institution} · Documento generado por ${siteConfig.name}`,
    pageW / 2,
    footerY,
    { align: "center" }
  );

  doc.save(buildFileName(`ficha-${student.enrollment_number}`, "pdf"));
}