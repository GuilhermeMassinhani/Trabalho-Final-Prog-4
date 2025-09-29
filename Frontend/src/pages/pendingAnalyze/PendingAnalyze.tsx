import { useFileContext } from "../../contexts/FilesContext";
import { Link } from "react-router-dom";

export function PendingAnalyze() {
  const { files, analyses } = useFileContext();

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
          <thead className="bg-zinc-50">
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
                    <span className={`px-2 py-1 rounded text-xs ${occ > 0 ? "bg-green-100 text-green-800" : "bg-zinc-400 text-zinc-600"}`}>
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

      <div className="text-xs text-zinc-500">
        Dica: use “Análise manual” para testar um novo parâmetro e depois clique em “Atualizar ocorrências globais”.
      </div>
    </div>
  );
}
