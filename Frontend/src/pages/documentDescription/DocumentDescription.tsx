import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { useFileContext } from "../../contexts/FilesContext";
import { findTermOccurrences } from "../../utils/pdfTools";

// renderização simples do PDF página a página
export function DocumentDescription() {
  const { files, analyses, searchParam } = useFileContext();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const fileName = params.get("file") || "";
  const file = useMemo(() => files.find((f) => f.name === fileName), [files, fileName]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState(searchParam);
  const [numPages, setNumPages] = useState<number>(0);
  const [pagesRendered, setPagesRendered] = useState<number>(0);

  useEffect(() => {
    if (!file || !containerRef.current) return;

    (async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);

      // limpa container
      containerRef.current!.innerHTML = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.3 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.className = "rounded-lg shadow mb-4";

        const context = canvas.getContext("2d")!;
        await page.render({ canvasContext: context, viewport }).promise;

        containerRef.current!.appendChild(canvas);
        setPagesRendered((prev) => prev + 1);
      }
    })();
  }, [file]);

  if (!file) return <div className="p-4 text-sm">Arquivo não encontrado.</div>;

  const analysis = analyses[file.name];
  const occurrences = useMemo(() => {
    const pagesText = analysis?.pagesText || [];
    if (!localQuery.trim()) return [];
    return findTermOccurrences(pagesText, localQuery);
  }, [analysis?.pagesText, localQuery]);

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{file.name}</h2>
          <div className="text-xs text-gray-500">
            Páginas renderizadas: {pagesRendered}/{numPages}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded-md px-3 py-2 text-sm w-80"
            placeholder="Buscar no texto extraído (OCR + PDF)"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de ocorrências no texto extraído */}
      {localQuery.trim() && (
        <div className="border rounded-lg p-3">
          <div className="font-semibold mb-2">
            Ocorrências no texto processado ({occurrences.length}):
          </div>
          {occurrences.length ? (
            <ul className="list-disc ml-5 text-sm">
              {occurrences.slice(0, 50).map((m, i) => (
                <li key={i}>
                  Página {m.page}: <code className="bg-gray-100 px-1">{m.snippet}</code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">Nenhuma ocorrência.</div>
          )}
        </div>
      )}

      {/* Canvas do PDF */}
      <div ref={containerRef} className="mt-2" />
    </div>
  );
}
