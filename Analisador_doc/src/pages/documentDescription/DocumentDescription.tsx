import React, { useState, useEffect } from "react";
import { useFileContext } from "../../contexts/FilesContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { api } from "../../lib/axios";

// Tipagem do documento
interface IDocument {
  id: number;
  name: string;
  path: string;
  status: string;
}

interface IReturnSearch {
  conta: number;
  documento: string;
  nome: string;
  oficios: string[];
}

interface IApiResponse {
  results: IReturnSearch[];
}

export const DocumentDescription: React.FC = () => {
  const { result, setSearchResults } = useFileContext();
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchDocument, setSearchDocument] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null); // Documento selecionado
  const [documentSearchResults, setDocumentSearchResults] = useState<Record<number, IReturnSearch[]>>(() => {
    // Recuperar resultados do sessionStorage
    const savedResults = sessionStorage.getItem("documentSearchResults");
    return savedResults ? JSON.parse(savedResults) : {};
  });

  // Salvar documentSearchResults no sessionStorage sempre que for atualizado
  useEffect(() => {
    sessionStorage.setItem("documentSearchResults", JSON.stringify(documentSearchResults));
  }, [documentSearchResults]);

  const searchDocuments = async (documentId: number) => {
    try {
      const response = await api.get<IApiResponse>(`/search?document_number=${searchDocument}`);
      if (response.status === 200) {
        const newResults = response.data.results;

        // Atualizar os resultados globais no searchResults
        setSearchResults((prevResults) => {
          const validPrevResults = Array.isArray(prevResults) ? prevResults : [];
          return [
            ...validPrevResults,
            ...newResults.filter(
              (newItem) =>
                !validPrevResults.some((existingItem) => existingItem.documento === newItem.documento)
            ),
          ];
        });

        // Associar os resultados ao documento específico
        setDocumentSearchResults((prevResults) => ({
          ...prevResults,
          [documentId]: newResults,
        }));

        setSearchCompleted(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Função para renderizar um documento individual
  const renderDocumentItem = (doc: any, index: number) => {
    const documentData: IDocument = {
      id: index,
      name: `Documento ${index + 1}`,
      path: doc.document,
      status:
        doc.cpf_numbers.length === 0 && doc.cnpj_numbers.length === 0
          ? "pendente"
          : "analisado",
    };

    const finalSearchResults = documentSearchResults[documentData.id] || [];

    return (
      <li
        key={`doc-${index}`}
        className="flex items-center justify-between p-4 w-full border rounded-lg shadow-sm hover:bg-gray-100"
      >
        <div className="flex flex-col">
          <h2 className="font-semibold">{documentData.name}</h2>
          <span className="text-gray-600">{documentData.path}</span>

          {/* Condicional para mostrar a etiqueta amarela */}
          {documentData.status === "pendente" && (
            <span className="bg-yellow-300 text-yellow-800 px-2 py-1 text-xs rounded-md mt-1">
              Pendente de Análise
            </span>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={() => setSelectedDocument(documentData)}
              className="hover:bg-azulReal-CMYK bg-azulAmplo-RGB hover:text-white text-white"
            >
              Visualizar
            </Button>
          </DialogTrigger>
          <DialogContent 
            aria-describedby="Conteúdo do modal, PDF renderizado, busca no banco de dados e entre outras funcionalidades"
            className="sm:max-w-[800px] flex flex-col items-center justify-center"
          >
            <DialogHeader className="flex flex-col w-full p-2 gap-4">
              <DialogTitle className="text-xl">{selectedDocument?.path}</DialogTitle>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  onChange={(e) => setSearchDocument(e.target.value)}
                  type="text"
                  placeholder="Busque o documento por aqui"
                />
                <Button
                  onClick={() => searchDocuments(documentData.id)}
                  className="bg-azulReal-CMYK hover:bg-azulReal-RGB"
                >
                  Buscar
                </Button>
              </div>
              {searchCompleted &&
                (finalSearchResults.length > 0 ? (
                  finalSearchResults.map((ret) => (
                    <li className="list-none flex gap-2" key={ret.conta}>
                      <span className="font-semibold">Resultados da {ret.oficios}</span>
                      <span>Nome: {ret.nome}</span>
                      <span>Conta: {ret.conta}</span>
                      <span>Documento: {ret.documento}</span>
                    </li>
                  ))
                ) : (
                  <p className="font-semibold mt-4">
                    Nenhum resultado encontrado para o documento pesquisado.
                  </p>
                ))}
            </DialogHeader>
            {selectedDocument && (
              <div className="w-full h-[500px]">
                <embed
                  src={`https://analisador.amplea.coop.br/api/uploads/${encodeURIComponent(
                    selectedDocument.path
                  )}`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                />
              </div>
            )}
            <DialogClose>
              <div
                role="button"
                className="text-white p-2 rounded-lg text-sm font-semibold bg-azulReal-CMYK hover:bg-azulReal-RGB"
              >
                <span>Finalizar Análise</span>
              </div>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4 mt-2 p-4">
      <h1 className="text-xl mt-2 mb-2 font-semibold"> Lista completa</h1>

      <ul className="space-y-2">
        {result.document_descriptions && result.document_descriptions.length > 0 ? (
          result.document_descriptions.map(renderDocumentItem)
        ) : (
          <p className="text-gray-500">Nenhum documento encontrado.</p>
        )}
      </ul>
    </div>
  );
};
