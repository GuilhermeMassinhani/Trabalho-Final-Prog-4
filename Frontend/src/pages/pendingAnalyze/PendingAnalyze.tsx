import { useFileContext } from "../../contexts/FilesContext";
import { Link } from "react-router-dom";

<<<<<<< HEAD
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
=======
export function PendingAnalyze() {
  const { files, analyses } = useFileContext();
>>>>>>> a97eb91b33f13e8b3fa3fee3983281aab9fe128c

  if (!files.length) {
    return (
      <div className="p-4 text-sm">
        Nenhum arquivo carregado. <Link className="underline" to="/">Enviar PDFs</Link>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Lista completa</h2>

      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Documento</th>
              <th className="text-left p-3 font-medium">Ocorrências</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => {
              const a = analyses[f.name];
              const occ = a?.matches?.length || 0;
              const status = a ? (a.found ? "Com ocorrências" : "Analisado, 0 ocorrências") : "Pendente";
              return (
                <tr key={f.name} className="border-t">
                  <td className="p-3">{f.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${occ > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {occ}
                    </span>
                  </td>
                  <td className="p-3">{status}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link className="underline" to={`/documentDescription?file=${encodeURIComponent(f.name)}`}>
                        Análise manual
                      </Link>
                      <Link className="underline" to="/relationship">
                        Ver ocorrências
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        Dica: use “Análise manual” para testar um novo parâmetro e depois clique em “Atualizar ocorrências globais”.
      </div>
    </div>
  );
}
