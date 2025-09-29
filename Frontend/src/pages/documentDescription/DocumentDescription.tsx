import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { useFileContext } from "../../contexts/FilesContext";
import { findTermOccurrences } from "../../utils/pdfTools";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function DocumentDescription() {
  const { files, analyses, searchParam, updateParamAndRequery, isLoading } = useFileContext();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const initialFile = params.get("file") || files[0]?.name || "";
  const [selected, setSelected] = useState(initialFile);
  const file = useMemo(() => files.find((f) => f.name === selected), [files, selected]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState(searchParam);
  const [numPages, setNumPages] = useState<number>(0);
  const [pagesRendered, setPagesRendered] = useState<number>(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [lastTriedAt, setLastTriedAt] = useState<number>(0); // força re-render manual

  // === util: checa se é um File válido (tem arrayBuffer)
  const isValidFileObj = !!(file && typeof (file as any).arrayBuffer === "function");

  useEffect(() => {
    if (!files.length) return;
    if (!selected) setSelected(files[0].name);
  }, [files, selected]);

  useEffect(() => {
    if (!file || !isValidFileObj) return;
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isValidFileObj]);

  async function renderWithPdfJs() {
    if (!file || !isValidFileObj || !containerRef.current) return;

    try {
      setRenderError(null);
      setPagesRendered(0);

      const arrayBuffer = await file.arrayBuffer(); // <== quebra se não for File verdadeiro
      const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);

      const host = containerRef.current!;
      host.innerHTML = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.className = "rounded-lg shadow mb-4";

        await page.render({ canvasContext: ctx, viewport }).promise;
        host.appendChild(canvas);
        setPagesRendered((prev) => prev + 1);
      }
    } catch (err: any) {
      console.error("pdf.js render error:", err);
      setRenderError(err?.message || "Falha ao renderizar PDF");
    }
  }

  // tenta renderizar quando muda arquivo / botão “tentar de novo”
  useEffect(() => {
    if (!file || !containerRef.current) return;
    if (!isValidFileObj) return; // mostraremos mensagem específica abaixo
    renderWithPdfJs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, isValidFileObj, lastTriedAt]);

  const analysis = file ? analyses[file.name] : undefined;
  const occurrences = useMemo(() => {
    const pagesText = analysis?.pagesText || [];
    if (!localQuery.trim()) return [];
    return findTermOccurrences(pagesText, localQuery);
  }, [analysis?.pagesText, localQuery]);

  const applyAndGoOccurrences = async () => {
    await updateParamAndRequery(localQuery);
    navigate("/relationship");
  };

  // ======= UI states claros =======
  if (!files.length) {
    return (
      <div className="p-4 text-sm">
        Nenhum arquivo carregado. <button className="underline" onClick={() => navigate("/")}>Enviar PDFs</button>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="p-4 text-sm">
        Arquivo não encontrado na seleção atual.
        <div className="mt-2">
          <label className="text-sm mr-2">Escolher:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="" disabled>Selecione…</option>
            {files.map((f) => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Se o objeto não é um File real (sessão recarregada, p.ex.)
  if (!isValidFileObj) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <div className="text-sm text-red-600">
          Este arquivo não é mais um <code>File</code> válido (provável reload da página). Reenvie os PDFs.
        </div>
        <div className="text-xs text-slate-600">
          Dica: objetos <code>File</code> não sobrevivem no <code>sessionStorage</code>. Evite persistir <code>files</code> ou não recarregue a página entre o upload e a visualização.
        </div>
        <button className="underline w-max text-sm" onClick={() => navigate("/")}>Voltar ao upload</button>

        {/* Diagnóstico visível */}
        <div className="border rounded p-3 text-xs">
          <div className="font-semibold mb-2">Diagnóstico do arquivo selecionado</div>
          <div>name: {file?.name}</div>
          <div>type: {(file as any)?.type?.toString?.() || "-"}</div>
          <div>size: {(file as any)?.size ?? "-"}</div>
          <div>tem arrayBuffer(): {String(typeof (file as any).arrayBuffer === "function")}</div>
        </div>
      </div>
    );
  }

  // ======= Render normal =======
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Arquivo:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {files.map((f) => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="border rounded-md px-3 py-2 text-sm w-80"
            placeholder="Novo parâmetro (será aplicado globalmente)"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          <button
            onClick={applyAndGoOccurrences}
            className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
            disabled={!localQuery.trim() || isLoading}
            title="Recalcula ocorrências em todos os arquivos e vai para 'Ocorrências encontradas'"
          >
            {isLoading ? "Atualizando..." : "Atualizar ocorrências globais"}
          </button>
        </div>
      </div>

      {/* Diagnóstico rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-700">
        <div className="border rounded p-2">
          <div className="font-semibold mb-1">Arquivo</div>
          <div>name: {file.name}</div>
          <div>type: {(file as any).type || "-"}</div>
          <div>size: {(file as any).size ?? "-"}</div>
          <div>pages renderizadas: {pagesRendered}/{numPages}</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-semibold mb-1">Parâmetro local</div>
          <div>{localQuery || "(vazio)"}</div>
          <div>Ocorrências (neste arquivo): {findTermOccurrences(analyses[file.name]?.pagesText || [], localQuery).length}</div>
        </div>
        <div className="border rounded p-2">
          <div className="font-semibold mb-1">Ações</div>
          <button
            onClick={() => setLastTriedAt(Date.now())}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          >
            Tentar renderizar de novo
          </button>
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 underline"
            >
              Abrir PDF em nova aba
            </a>
          )}
        </div>
      </div>

      {/* Lista de ocorrências deste arquivo */}
      {localQuery.trim() && (
        <div className="border rounded-lg p-3">
          <div className="font-semibold mb-2">
            Ocorrências (neste arquivo) — {findTermOccurrences(analyses[file.name]?.pagesText || [], localQuery).length}
          </div>
          {occurrences.length ? (
            <ul className="list-disc ml-5 text-sm">
              {occurrences.slice(0, 100).map((m, i) => (
                <li key={i}>
                  Página {m.page}: <code className="bg-gray-100 px-1">{m.snippet}</code>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">Nenhuma ocorrência neste arquivo.</div>
          )}
        </div>
      )}

      {/* Viewer */}
      {!renderError ? (
        <div ref={containerRef} className="mt-2 max-h-[75vh] overflow-auto w-full border rounded p-2 bg-white" />
      ) : (
        <div className="border rounded-lg p-3">
          <div className="text-sm text-red-600 mb-2">
            Falha ao renderizar no canvas: {renderError}
          </div>
          {blobUrl ? (
            <object data={blobUrl} type="application/pdf" className="w-full h-[75vh] rounded-lg">
              <p className="text-sm">
                Seu navegador não exibiu o PDF.{" "}
                <a href={blobUrl} target="_blank" rel="noreferrer" className="underline">
                  Abrir em outra aba
                </a>.
              </p>
            </object>
          ) : (
            <div className="text-xs text-gray-600">Sem blob URL disponível.</div>
          )}
        </div>
      )}
    </div>
  );
}
