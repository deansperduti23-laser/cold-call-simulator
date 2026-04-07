// Parse uploaded script files (docx, pdf, txt) into both displayable HTML
// and a plain-text version for the AI prompt context.

import mammoth from "mammoth";

export interface ParsedScript {
  fileName: string;
  mimeType: string;
  /** Plain text used as context for the AI prospect. */
  text: string;
  /** Sanitized HTML used to render the script in the Script tab. */
  html: string;
  /** Data URL of the original file, used for embedded PDF rendering. */
  dataUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function parseScriptFile(file: File): Promise<ParsedScript> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const dataUrl = await fileToDataUrl(file);

  if (ext === "txt" || ext === "md") {
    const text = await file.text();
    return {
      fileName: file.name,
      mimeType: "text/plain",
      text,
      html: `<pre class="whitespace-pre-wrap font-sans text-xs leading-relaxed">${escapeHtml(text)}</pre>`,
      dataUrl,
    };
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    return {
      fileName: file.name,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      text: textResult.value,
      html: htmlResult.value || `<pre class="whitespace-pre-wrap text-xs">${escapeHtml(textResult.value)}</pre>`,
      dataUrl,
    };
  }

  if (ext === "pdf") {
    const text = await parsePdfText(file);
    return {
      fileName: file.name,
      mimeType: "application/pdf",
      text,
      // PDF will be rendered using the original embedded data URL.
      html: "",
      dataUrl,
    };
  }

  // Fallback: treat as plain text
  const text = await file.text();
  return {
    fileName: file.name,
    mimeType: file.type || "text/plain",
    text,
    html: `<pre class="whitespace-pre-wrap text-xs">${escapeHtml(text)}</pre>`,
    dataUrl,
  };
}

async function parsePdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
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
