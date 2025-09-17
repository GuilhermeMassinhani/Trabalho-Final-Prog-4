import { useDropzone } from "react-dropzone";
import React, { useState } from "react";
import { CloudUpload } from "lucide-react";
import { useFileContext } from "../../contexts/FilesContext";
import { AlertDialogButton } from '../../components/AlertDialog';

export const AnalyzerDropzone: React.FC = () => {
  const { sendFiles, setFiles, isLoading, setIsLoading, files } = useFileContext();
  const [isAnalyzed, setIsAnalyzed] = useState(() => {
    const savedState = sessionStorage.getItem("isAnalyzed");
    return savedState ? JSON.parse(savedState) : false;
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (!isAnalyzed) { // Apenas aceita novos arquivos se a análise não foi concluída
      setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    }
  };

  const handleSendFiles = async () => {
    setIsLoading(true);
    await sendFiles();
    setIsLoading(false);
    setIsAnalyzed(true);
    sessionStorage.setItem("isAnalyzed", JSON.stringify(true)); // Salva no sessionStorage
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    disabled: isAnalyzed, // Desabilita o dropzone após análise
  });

  return (
    <>
      <div className="flex w-full gap-2 flex-col">
        <div className="flex flex-col w-full gap-1 h-auto">
          <div className="flex flex-col h-max items-center">
            <div
              className={`py-4 px-2 w-2/4 h-24 group justify-center cursor-pointer rounded-2xl gap-2 flex border border-dotted ${
                isAnalyzed ? "border-cinza-04 cursor-not-allowed" : "border-chumbo-02"
              } flex-col items-center`}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <span className="text-sm font-semibold text-azulReal-CMYK">
                  Arraste para cá
                </span>
              ) : (
                <>
                  <div className="flex gap-2 group select-none w-max">
                    <CloudUpload color={isAnalyzed ? "#c4c4c4" : "#5f82af"} size={20} />
                    <span
                      className={`text-sm select-none font-semibold ${
                        isAnalyzed ? "text-cinza-04 hover:cursor-not-allowed" : "text-azulReal-CMYK"
                      }`}
                    >
                      Faça Upload dos arquivos
                    </span>
                    <span
                      className={`text-sm ${
                        isAnalyzed ? "text-cinza-04 hover:cursor-not-allowed" : "text-chumbo-02"
                      }`}
                    >
                      Arraste ou clique aqui
                    </span>
                  </div>
                  <span className={`text-sm ${isAnalyzed ? "text-cinza-04 hover:cursor-not-allowed" : "text-chumbo-02"}`}>
                    PDF
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex justify-between">
            <button
              onClick={handleSendFiles}
              className="border disabled:bg-cinza-04 disabled:cursor-not-allowed w-max text-sm font-medium p-2 ease-in-out delay-150 bg-azulReal-CMYK text-white rounded-lg hover:bg-azulReal-RGB transition"
              disabled={isLoading || isAnalyzed} // Desativa o botão se estiver carregando ou já analisado
            >
              {isLoading
                ? "Enviando documentos..."
                : isAnalyzed
                ? "Análise concluída"
                : `Iniciar análise dos ${files.length} documentos`}
            </button>
            <AlertDialogButton />
          </div>
        )}

        {isLoading && (
          <div className="flex items-center mt-2">
            <div className="w-full bg-gray-300 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full animate-pulse"
                style={{ width: "100%" }}
              ></div>
            </div>
            <span className="ml-2 text-sm animate-pulse text-azulReal-CMYK">Carregando...</span>
          </div>
        )}
      </div>
    </>
  );
};
