import { useFileContext } from "../../contexts/FilesContext";
import { Link } from "react-router-dom";

export function PendingAnalyze() {
  const { files, analyses, searchParam } = useFileContext();

  if (!files.length) {
    return <div className="p-4 text-sm">Nenhum arquivo carregado.</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Resultados da análise — parâmetro: <span className="font-mono">{searchParam}</span>
      </h2>

      <div className="flex flex-col gap-3">
        {files.map((f) => {
          const a = analyses[f.name];
          const status = a?.found ? "Encontrado" : "Não encontrado";
          return (
            <div key={f.name} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className={`text-sm ${a?.found ? "text-green-600" : "text-red-600"}`}>
                    {status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    className="text-sm underline"
                    to={`/documentDescription?file=${encodeURIComponent(f.name)}`}
                  >
                    Abrir PDF / Buscar
                  </Link>
                </div>
              </div>

              {a?.found && a.matches.length > 0 && (
                <div className="mt-2 text-sm">
                  <div className="font-semibold">Ocorrências:</div>
                  <ul className="list-disc ml-5">
                    {a.matches.slice(0, 5).map((m, idx) => (
                      <li key={idx}>
                        Página {m.page}: <code className="bg-gray-100 px-1">{m.snippet}</code>
                      </li>
                    ))}
                  </ul>
                  {a.matches.length > 5 && <div className="text-xs mt-1">...e mais {a.matches.length - 5}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
