import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../lib/axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

// Tipagem do contexto
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
  result: IApiResult;
  setFiles: (files: File[]) => void;
  sendFiles: () => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  searchResults: Record<string, IReturnSearch[]>; // Associar resultados ao documento
  setSearchResults: (results: Record<string, IReturnSearch[]>) => void;
  clearSearch: () => void;
}

interface IFileProviderProps {
  children: ReactNode;
}

interface IReturnSearch {
  conta: number;
  documento: string;
  nome: string;
  oficios: string[];
}

// Criação do contexto
const FileContext = createContext<IReturnApi | undefined>(undefined);

export const FileProvider: React.FC<IFileProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const defaultResult: IApiResult = {
    document_descriptions: [],
    no_cpf_cnpj_docs: [],
    results: [],
  };

  const [files, setFiles] = useState<File[]>(JSON.parse(sessionStorage.getItem("files") || "[]"));
  const [result, setResult] = useState<IApiResult>(
    JSON.parse(sessionStorage.getItem("result") || "null") || defaultResult
  );
  const [searchResults, setSearchResults] = useState<Record<string, IReturnSearch[]>>(
    JSON.parse(sessionStorage.getItem("searchResults") || "{}")
  );

  const navigate = useNavigate();

  const sendFiles = async () => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files[]", file));

    try {
      const response = await api.post("/upload", formData);
      if (response.status === 200) {
        setResult(response.data);
        Swal.fire({
          icon: "success",
          title: "Documentos analisados com sucesso!",
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: "top",
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate("/pendingAnalyze");
        }, 3000);
      }
    } catch (error) {
      console.error("Erro no envio de arquivos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Persistência no sessionStorage
  useEffect(() => {
    sessionStorage.setItem("files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    sessionStorage.setItem("result", JSON.stringify(result));
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem("searchResults", JSON.stringify(searchResults));
  }, [searchResults]);

  const clearSearch = () => {
    setFiles([]);
    setSearchResults({});
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <FileContext.Provider
      value={{
        setSearchResults,
        searchResults,
        isLoading,
        setIsLoading,
        files,
        result,
        setFiles,
        sendFiles,
        clearSearch,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

// Hook personalizado
export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext deve ser usado dentro de FileProvider");
  }
  return context;
};
