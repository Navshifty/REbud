import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { normaliseText } from "../lib/text.js";

/*
  Turns an uploaded file into plain text. Returns
    { text, pages, method }            on success
  and throws with a readable message when the file can't be read.
*/

const TEXT_EXTENSIONS = new Set(["txt", "md", "csv"]);

export function isExtractable(ext) {
  return TEXT_EXTENSIONS.has(ext) || ext === "pdf" || ext === "docx";
}

export async function extractText(buffer, ext) {
  if (TEXT_EXTENSIONS.has(ext)) {
    return { text: normaliseText(buffer.toString("utf8")), pages: null, method: "utf8" };
  }

  if (ext === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = normaliseText(result.text);
      if (!text) throw new Error("The PDF contains no extractable text (it may be scanned images). OCR is not supported yet.");
      return { text, pages: result.total ?? null, method: "pdf-parse" };
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (ext === "docx") {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = normaliseText(value);
    if (!text) throw new Error("The DOCX file contains no readable text.");
    return { text, pages: null, method: "mammoth" };
  }

  throw new Error(`Text extraction isn't supported for .${ext} files.`);
}
