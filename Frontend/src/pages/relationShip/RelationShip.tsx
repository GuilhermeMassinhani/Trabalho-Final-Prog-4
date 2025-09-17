import { useFileContext } from "../../contexts/FilesContext";

export const RelationShip = () => {
  const { searchResults, result } = useFileContext();

  return (
    <div className="gap-2 flex flex-col">
      <div className="flex flex-col p-2 gap-2">
        {/* Exibir resultados gerais */}
        <div className="p-4">
          {result?.results?.length > 0 ? (
            result.results.map((rel, index) => (
              <div key={index} className="flex flex-col p-2 rounded border">
                <h1 className="text-lg font-bold">Conta: {rel.conta}</h1>
                <span>Documento: {rel.documento}</span>
                <span>Nome: {rel.nome}</span>
                {rel.oficios.length > 0 && (
                  <ul className="list-disc pl-6">
                    {rel.oficios.map((oficio, i) => (
                      <li key={i}>{oficio}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="font-semibold">Nenhuma relação encontrada.</p>
          )}
        </div>

        {/* Exibir resultados de busca manual */}
        <div className="p-4 flex flex-col gap-2">
          {searchResults.length > 0 && <h1 className="font-semibold">Resultados de busca manual:</h1>}
          {searchResults.length > 0 ? (
            searchResults.map((rel, index) => (
              <div key={index} className="flex flex-col p-2 rounded border">
                <h1 className="text-lg font-bold">Conta: {rel.conta}</h1>
                <span>Documento: {rel.documento}</span>
                <span>Nome: {rel.nome}</span>
                {rel.oficios.length > 0 && (
                  <ul className="list-disc pl-6">
                    {rel.oficios.map((oficio, i) => (
                      <li key={i}>{oficio}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="font-semibold">Nenhum resultado de busca encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};
