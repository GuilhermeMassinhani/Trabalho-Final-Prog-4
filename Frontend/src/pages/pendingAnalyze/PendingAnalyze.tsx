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
import { Checkbox } from "../../components/ui/checkbox";
import { api } from "../../lib/axios";
import { Input } from "../../components/ui/input";

interface IDocument {
  id: number;
  name: string;
  path: string;
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

export const PendingAnalyze: React.FC = () => {
  const { result, setSearchResults } = useFileContext();
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  const [searchDocument, setSearchDocument] = useState("");
  const [documentSearchResults, setDocumentSearchResults] = useState<Record<number, IReturnSearch[]>>(() => {
    // Recuperar resultados do sessionStorage
    const savedResults = sessionStorage.getItem("documentSearchResults");
    return savedResults ? JSON.parse(savedResults) : {};
  });

  const [checkedDocuments, setCheckedDocuments] = useState<Record<number, boolean>>(() => {
    const savedCheckedDocuments = sessionStorage.getItem("checkedDocuments");
    return savedCheckedDocuments ? JSON.parse(savedCheckedDocuments) : {};
  });

  // Salvar documentSearchResults no sessionStorage sempre que for atualizado
  useEffect(() => {
    sessionStorage.setItem("documentSearchResults", JSON.stringify(documentSearchResults));
  }, [documentSearchResults]);

  // Salvar checkedDocuments no sessionStorage sempre que for atualizado
  useEffect(() => { 
    sessionStorage.setItem("checkedDocuments", JSON.stringify(checkedDocuments));
  }, [checkedDocuments]);

  const toggleCheck = (id: number) => {
    setCheckedDocuments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      }
        } catch (error) {
           console.error(error);
         }
       };

  const renderDocumentItem = (doc: string, index: number) => {
    const documentData: IDocument = {
      id: index,
      name: `Documento ${index + 1}`,
      path: doc,
    };

    // Resultados específicos para o documento
    const finalSearchResults = documentSearchResults[documentData.id] || [];

    return (
      <li
        key={`doc-${index}`}
        className="flex items-center justify-between p-4 w-1/3 border rounded-lg shadow-sm hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!checkedDocuments[documentData.id]}
            onCheckedChange={() => toggleCheck(documentData.id)}
            id={`checkbox-${documentData.id}`}
          />
          <label
            htmlFor={`checkbox-${documentData.id}`}
            className="text-sm font-medium cursor-pointer"
          >
            Documento {documentData.id + 1}
          </label>
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
            className="sm:max-w-[800px] flex flex-col items-center justify-center"
            aria-describedby="Conteúdo do modal, PDF renderizado, busca no banco de dados e entre outras funcionalidades"
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
              {finalSearchResults.length > 0 ? (
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
              )}
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
                onClick={() => toggleCheck(documentData.id)}
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
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Documentos pendentes de Análise</h1>
      <ul className="space-y-2">
        {result.no_cpf_cnpj_docs && result.no_cpf_cnpj_docs.length > 0 ? (
          result.no_cpf_cnpj_docs.map(renderDocumentItem)
        ) : (
          <p className="text-gray-500">Nenhum documento encontrado.</p>
        )}
      </ul>
    </div>
  );
};
