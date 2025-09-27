import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { extractTextWithPdfJs, ocrPdfPageToText, findTermOccurrences } from "../utils/pdfTools";

/* =========================
 * Tipagens
 * ========================= */

export interface IReturnSearch {
  conta: number;        // opcional/legado (mantenho caso você use em alguma tela)
  documento: string;    // nome do arquivo
  nome: string;         // opcional
  oficios: string[];    // opcional
}

export type DocAnalysis = {
  fileName: string;
  pagesText: string[]; // texto de cada página (pdf.js e/ou OCR)
  found: boolean;
  matches: { page: number; index: number; snippet: string }[];
};

// Mantido apenas para compatibilidade com telas antigas
export interface IApiResult {
  document_descriptions: Array<{
    cnpj_numbers: string[];
    cpf_numbers: string[];
    description: string;
    document: string;
  }>;
  no_cpf_cnpj_docs: string[];
  results: [];
}

export interface IReturnApi {
  // Arquivos
  files: File[];
  setFiles: (files: File[] | ((prev: File[]) => File[])) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Parâmetro/busca global
  searchParam: string;
  setSearchParam: (s: string) => void;

  // Resultado de análise por documento
  analyses: Record<string, DocAnalysis>;

  // Ações principais
  analyzeFiles: () => Promise<void>;                // primeira análise com parâmetro atual
  updateParamAndRequery: (newParam: string) => Promise<void>; // troca termo e reconta TUDO

  // Legado/compat (se ainda houver telas consumindo)
  result: IApiResult;
  searchResults: Record<string, IReturnSearch[]>;
  setSearchResults: (r: Record<string, IReturnSearch[]>) => void;

  // Limpar tudo e recomeçar
  clearSearch: () => void;
}

interface IFileProviderProps {
  children: ReactNode;
}

/* =========================
 * Contexto
 * ========================= */

const FileContext = createContext<IReturnApi | undefined>(undefined);

export const FileProvider: React.FC<IFileProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  // Loading UI
  const [isLoading, setIsLoading] = useState(false);

  // Estado principal
  const [files, setFiles] = useState<File[]>(
    JSON.parse(sessionStorage.getItem("files") || "[]")
  );

  const [searchParam, setSearchParam] = useState<string>(
    sessionStorage.getItem("searchParam") || ""
  );

  const [analyses, setAnalyses] = useState<Record<string, DocAnalysis>>(
    JSON.parse(sessionStorage.getItem("analyses") || "{}")
  );

  // Compatibilidade com telas legadas (não usados na nova lógica)
  const defaultResult: IApiResult = {
    document_descriptions: [],
    no_cpf_cnpj_docs: [],
    results: [],
  };
  const [result, setResult] = useState<IApiResult>(
    JSON.parse(sessionStorage.getItem("result") || "null") || defaultResult
  );
  const [searchResults, setSearchResults] = useState<Record<string, IReturnSearch[]>>(
    JSON.parse(sessionStorage.getItem("searchResults") || "{}")
  );

  /* =========================
   * Helpers
   * ========================= */

  async function ensurePagesTextForFile(file: File): Promise<string[]> {
    // Primeiro tenta texto nativo com pdf.js
    const { pages } = await extractTextWithPdfJs(file);
    return pages; // Se precisar, o OCR entra nas funções principais
  }

  /* =========================
   * Ações principais
   * ========================= */

  /** Primeira análise: usa searchParam atual, tenta pdf.js e, se não achar, roda OCR por página. */
  const analyzeFiles = async () => {
    if (!files.length) return;

    const term = (searchParam || "").trim();
    if (!term) {
      Swal.fire({
        icon: "warning",
        title: "Informe o parâmetro de busca",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top",
      });
      return;
    }

    setIsLoading(true);
    const newAnalyses: Record<string, DocAnalysis> = { ...analyses };

    for (const file of files) {
      const name = file.name;
      try {
        // 1) Extrai texto nativo
        const { pages } = await extractTextWithPdfJs(file);
        let matches = findTermOccurrences(pages, term);

        // 2) Se não achou, OCR página a página (para no primeiro hit)
        if (!matches.length) {
          const ocrPagesText: string[] = [...pages];

          // Precisamos do número de páginas do PDF
          const ab = await file.arrayBuffer();
          const pdf = await (await (await import("pdfjs-dist")).getDocument({ data: ab }).promise);

          for (let p = 1; p <= pdf.numPages; p++) {
            const ocrText = await ocrPdfPageToText(file, p);
            if (ocrText && ocrText.trim().length > 0) {
              ocrPagesText[p - 1] = ocrText;
            }
            matches = findTermOccurrences(ocrPagesText, term);
            if (matches.length) {
              newAnalyses[name] = {
                fileName: name,
                pagesText: ocrPagesText,
                found: true,
                matches,
              };
              break;
            }
          }

          if (!matches.length) {
            newAnalyses[name] = {
              fileName: name,
              pagesText: ocrPagesText,
              found: false,
              matches: [],
            };
          }
        } else {
          newAnalyses[name] = {
            fileName: name,
            pagesText: pages,
            found: true,
            matches,
          };
        }
      } catch (e) {
        console.error("Erro analisando", name, e);
        newAnalyses[name] = {
          fileName: name,
          pagesText: [],
          found: false,
          matches: [],
        };
      }
    }

    setAnalyses(newAnalyses);
    setIsLoading(false);

    Swal.fire({
      icon: "success",
      title: "Análise concluída!",
      timer: 1800,
      showConfirmButton: false,
      toast: true,
      position: "top",
    });

    // Por padrão, após a 1ª análise, vai para lista completa
    navigate("/pendingAnalyze");
  };

  /** Troca o parâmetro global e reconta matches em TODOS os arquivos.
   *  Garante pagesText (pdf.js) e, se não achar, OCR página a página.
   */
  const updateParamAndRequery = async (newParam: string) => {
    const term = (newParam || "").trim();
    setSearchParam(term);
    if (!files.length) return;

    setIsLoading(true);
    const updated: Record<string, DocAnalysis> = { ...analyses };

    for (const file of files) {
      const name = file.name;
      try {
        let pagesText = updated[name]?.pagesText;

        // Garante que temos texto base (pdf.js)
        if (!pagesText || !pagesText.length) {
          pagesText = await ensurePagesTextForFile(file);
        }

        // 1) Busca com texto atual
        let matches = findTermOccurrences(pagesText, term);

        // 2) Se não achou, OCR página a página (atualiza pagesText se encontrar algo)
        if (!matches.length) {
          const ab = await file.arrayBuffer();
          const pdf = await (await (await import("pdfjs-dist")).getDocument({ data: ab }).promise);

          const ocrPagesText = [...pagesText];
          for (let p = 1; p <= pdf.numPages; p++) {
            const ocrText = await ocrPdfPageToText(file, p);
            if (ocrText?.trim()) ocrPagesText[p - 1] = ocrText;

            matches = findTermOccurrences(ocrPagesText, term);
            if (matches.length) {
              pagesText = ocrPagesText;
              break;
            }
          }
          if (!matches.length) {
            pagesText = ocrPagesText;
          }
        }

        updated[name] = {
          fileName: name,
          pagesText,
          found: matches.length > 0,
          matches,
        };
      } catch (e) {
        console.error("Erro reanalisando", name, e);
        updated[name] = {
          fileName: name,
          pagesText: updated[name]?.pagesText || [],
          found: false,
          matches: [],
        };
      }
    }

    setAnalyses(updated);
    setIsLoading(false);
  };

  /* =========================
   * Persistência
   * ========================= */

  useEffect(() => {
    sessionStorage.setItem("files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    sessionStorage.setItem("result", JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem("searchResults", JSON.stringify(searchResults));
  }, [searchResults]);

  useEffect(() => {
    sessionStorage.setItem("analyses", JSON.stringify(analyses));
  }, [analyses]);

  useEffect(() => {
    sessionStorage.setItem("searchParam", searchParam);
  }, [searchParam]);

  /* =========================
   * Limpar estado
   * ========================= */

  const clearSearch = () => {
    setFiles([]);
    setAnalyses({});
    setSearchResults({});
    setSearchParam("");
    setResult(defaultResult);
    sessionStorage.clear();
    window.location.reload();
  };

  /* =========================
   * Provider
   * ========================= */

  return (
    <FileContext.Provider
      value={{
        files,
        setFiles,
        isLoading,
        setIsLoading,

        searchParam,
        setSearchParam,
        analyses,

        analyzeFiles,
        updateParamAndRequery,

        // legado
        result,
        searchResults,
        setSearchResults,

        clearSearch,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

/* =========================
 * Hook
 * ========================= */

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFileContext deve ser usado dentro de FileProvider");
  return context;
};
