export const siteConfig = {
  name: "Ficha Estudiantil",
  institution: "ASEUCAM",
  description: "Administra y consulta la información de tus estudiantes.",
  photoBucket: "student-photos",
  maxPhotoSizeMb: 5,
  itemsPerPage: 12,
  tablePageSize: 10,
} as const;

export type SiteConfig = typeof siteConfig;