import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { extractTextWithPdfJs, ocrPdfPageToText, findTermOccurrences } from "../utils/pdfTools";

interface IReturnSearch {
  conta: number;        // (mantido se você usa em algum lugar; aqui não é obrigatório)
  documento: string;    // nome do arquivo
  nome: string;         // opcional
  oficios: string[];    // opcional
}

type DocAnalysis = {
  fileName: string;
  pagesText: string[]; // texto de cada página (pdf.js e/ou OCR)
  found: boolean;
  matches: { page: number; index: number; snippet: string }[];
};

interface IApiResult {
  document_descriptions: Array<{
    cnpj_numbers: string[];
    cpf_numbers: string[];
    description: string;
    document: string;
  }>;
  no_cpf_cnpj_docs: string[];
  results: [];
}

interface IReturnApi {
  files: File[];
  setFiles: (files: File[] | ((prev: File[]) => File[])) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // NOVOS: análise local
  searchParam: string;
  setSearchParam: (s: string) => void;
  analyses: Record<string, DocAnalysis>;
  analyzeFiles: () => Promise<void>;

  // legado que você já usa em outras telas
  result: IApiResult; // mantido, mas agora não vem de API
  searchResults: Record<string, IReturnSearch[]>;
  setSearchResults: (r: Record<string, IReturnSearch[]>) => void;
  clearSearch: () => void;
}

interface IFileProviderProps {
  children: ReactNode;
}

const FileContext = createContext<IReturnApi | undefined>(undefined);

export const FileProvider: React.FC<IFileProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const defaultResult: IApiResult = {
    document_descriptions: [],
    no_cpf_cnpj_docs: [],
    results: [],
  };

  const [files, setFiles] = useState<File[]>(
    JSON.parse(sessionStorage.getItem("files") || "[]")
  );

  // **parâmetro de busca** controlado no contexto p/ reaproveitar em páginas
  const [searchParam, setSearchParam] = useState<string>(
    sessionStorage.getItem("searchParam") || ""
  );

  // análises por documento
  const [analyses, setAnalyses] = useState<Record<string, DocAnalysis>>(
    JSON.parse(sessionStorage.getItem("analyses") || "{}")
  );

  // legado/compatibilidade com telas já criadas
  const [result, setResult] = useState<IApiResult>(
    JSON.parse(sessionStorage.getItem("result") || "null") || defaultResult
  );
  const [searchResults, setSearchResults] = useState<Record<string, IReturnSearch[]>>(
    JSON.parse(sessionStorage.getItem("searchResults") || "{}")
  );

  const navigate = useNavigate();

  /** Analisa arquivos localmente: pdf.js -> busca; se não achou, OCR página a página até achar ou terminar */
  const analyzeFiles = async () => {
    if (!files.length) return;
    if (!searchParam.trim()) {
      Swal.fire({ icon: "warning", title: "Informe o parâmetro de busca", timer: 2000, showConfirmButton: false, toast: true, position: "top" });
      return;
    }

    setIsLoading(true);
    const newAnalyses: Record<string, DocAnalysis> = { ...analyses };

    for (const file of files) {
      const name = file.name;
      try {
        // 1) Tenta extrair texto com pdf.js
        const { pages } = await extractTextWithPdfJs(file);
        let matches = findTermOccurrences(pages, searchParam);

        // 2) Se não encontrou, tenta OCR página a página (leve: sai no 1º hit)
        if (!matches.length) {
          const ocrPagesText: string[] = [...pages]; // reaproveita vector
          for (let p = 1; p <= pages.length; p++) {
            // se a página já tem texto plausível, pula o OCR dessa página
            if ((pages[p - 1] || "").trim().length > 5) continue;

            const ocrText = await ocrPdfPageToText(file, p);
            ocrPagesText[p - 1] = ocrText;
            matches = findTermOccurrences(ocrPagesText, searchParam);
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
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: "top",
    });

    navigate("/pendingAnalyze");
  };

  // Persistências
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

  const clearSearch = () => {
    setFiles([]);
    setAnalyses({});
    setSearchResults({});
    sessionStorage.clear();
    window.location.reload();
  };

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

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error("useFileContext deve ser usado dentro de FileProvider");
  return context;
};
