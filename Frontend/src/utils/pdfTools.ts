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
/** Extrai TODOS os itens de texto do pdf.js por página, para debug */
export async function debugExtractAllTextItems(file: File): Promise<Array<{page: number, items: string[], joined: string}>> {
  const buf = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const out: Array<{page: number, items: string[], joined: string}> = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items.map((it: any) => (it.str ?? "").toString());
    const joined = items.join(" ");
    out.push({ page: i, items, joined });
  }
  return out;
}

/** (opcional) Loga no console tudo que o pdf.js retornou (com alguns metadados) */
export async function debugLogPdfJs(file: File) {
  const buf = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  // metadados básicos
  console.group(`pdfjs DEBUG :: ${file.name}`);
  console.log("numPages:", pdf.numPages);
  try {
    const meta = await pdf.getMetadata().catch(() => null);
    if (meta) console.log("metadata:", meta?.info, meta?.metadata?.metadata?._metadata);
  } catch {}
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    console.group(`page ${i}`);
    console.log("items length:", tc.items.length);
    tc.items.forEach((it: any, idx: number) => {
      console.log(idx, it?.str, { dir: it?.dir, fontName: it?.fontName, transform: it?.transform });
    });
    console.groupEnd();
  }
  console.groupEnd();
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

function norm(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cria regex “solta”: permite espaços/pontuação entre os caracteres do termo */
function makeLooseRegex(term: string) {
  const t = norm(term);
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // entre cada caractere permite \s ou não-palavra (pontuação, _)
  const pattern = esc.split("").join("[\\s\\W_]*");
  return new RegExp(pattern, "gi");
}

/** Busca tolerante (acentos/espaços/pontuação) em todas as páginas  */
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
