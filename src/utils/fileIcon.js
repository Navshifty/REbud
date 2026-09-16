import { File, FileSpreadsheet, FileText } from "lucide-react";

/* Map an uploaded document's type label (PDF, CSV, DOCX, ...) to a lucide icon component. */
export function fileIcon(type) {
  if (type === "CSV") return FileSpreadsheet;
  if (type === "PDF") return FileText;
  return File;
}
