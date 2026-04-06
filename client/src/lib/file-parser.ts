// Parse uploaded script files (docx, pdf, txt) into plain text

import mammoth from "mammoth";

export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return await file.text();
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (ext === "pdf") {
    return await parsePdf(file);
  }

  // Fallback: try as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: .${ext}`);
  }
}

async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

export function getAcceptedFileTypes(): string {
  return ".txt,.md,.docx,.pdf";
}
