import { siteConfig } from "@/config/site";
import { supabase } from "@/lib/supabase";
import { formatBytes } from "@/lib/utils";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_SIZE_BYTES = siteConfig.maxPhotoSizeMb * 1024 * 1024;
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.85;

export interface PhotoValidation {
  ok: boolean;
  error?: string;
}

export function validatePhoto(file: File): PhotoValidation {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "Solo se permiten imágenes JPG, JPEG, PNG o WebP.",
    };
  }

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: "La extensión del archivo no es válida (JPG, JPEG, PNG o WebP).",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      ok: false,
      error: `La imagen supera el tamaño máximo de ${siteConfig.maxPhotoSizeMb} MB (${formatBytes(MAX_SIZE_BYTES)}).`,
    };
  }

  return { ok: true };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

/**
 * Redimensiona y comprime la imagen para evitar archivos pesados.
 * Devuelve un Blob JPEG de máximo MAX_DIMENSION píxeles.
 */
export async function processPhoto(file: File): Promise<Blob> {
  const img = await loadImage(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo procesar la imagen."));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export async function uploadPhoto(
  blob: Blob,
  existingUrl?: string | null
): Promise<string> {
  const path = `students/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(siteConfig.photoBucket)
    .upload(path, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  if (existingUrl) {
    await deletePhoto(existingUrl).catch(() => {
      // No bloqueamos la operación si falla la limpieza de la foto anterior.
    });
  }

  const { data } = supabase.storage
    .from(siteConfig.photoBucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/** Extrae la ruta del objeto en el bucket a partir de la URL pública. */
export function photoPathFromUrl(url: string): string | null {
  const marker = `/object/public/${siteConfig.photoBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function deletePhoto(url: string): Promise<void> {
  const path = photoPathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage
    .from(siteConfig.photoBucket)
    .remove([path]);

  if (error) throw error;
}