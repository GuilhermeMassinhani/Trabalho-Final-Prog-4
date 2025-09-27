import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

export async function extractTextWithPdfJs(file: File): Promise<{ pages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((it: any) => it.str ?? "").join(" ");
    pages.push(text);
  }
  return { pages };
}

export async function ocrPdfPageToText(file: File, pageNumber: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;

  const { data } = await Tesseract.recognize(canvas, "por+eng");
  return data.text || "";
}

/** Normaliza string: remove acentos, comprime espaços, mantém só texto útil */
function norm(s: string) {
  return (s || "")
    .normalize("NFD")
    // remove sinais diacríticos (acentos)
    .replace(/\p{Diacritic}/gu, "")
    // troca qualquer whitespace por 1 espaço
    .replace(/\s+/g, " ")
    .trim();
}

/** Cria regex “solta”: permite espaços/pontuação entre os caracteres do termo */
function makeLooseRegex(term: string) {
  const t = norm(term);
  // escapa meta-caracteres
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // entre cada caractere permite \s ou não-palavra (pontuação, _)
  const pattern = esc.split("").join("[\\s\\W_]*");
  return new RegExp(pattern, "gi");
}

/** Busca tolerante (case/acentos/espaços/pontuação) em todas as páginas  */
export function findTermOccurrences(pages: string[], term: string) {
  const re = makeLooseRegex(term);
  const results: Array<{ page: number; index: number; snippet: string }> = [];

  pages.forEach((origTxt, i) => {
    const txt = norm(origTxt);
    let match: RegExpExecArray | null;
    while ((match = re.exec(txt)) !== null) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(txt.length, match.index + match[0].length + 40);
      const snippet = txt.slice(start, end);
      results.push({ page: i + 1, index: match.index, snippet });
    }
  });

  return results;
}
