import { useMemo, useState } from "react";
import { useFileContext } from "../../contexts/FilesContext";

export function RelationShip() {
  const { analyses, searchParam } = useFileContext();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const names = Object.keys(analyses || {});
    return names.flatMap((name) => {
      const a = analyses[name];
      if (!a?.matches?.length) return [];
      return a.matches.map((m, idx) => ({
        fileName: name,
        page: m.page,
        snippet: m.snippet,
        key: `${name}-${idx}`,
      }));
    });
  }, [analyses]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      r.fileName.toLowerCase().includes(term) ||
      r.snippet.toLowerCase().includes(term)
    );
  }, [rows, q]);

  const total = rows.length;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ocorrências encontradas</h2>
          <div className="text-sm text-zinc-500">
            Parâmetro atual: <span className="font-mono">{searchParam || "(vazio)"}</span> • {total} ocorrência(s)
          </div>
        </div>
        <input
          className="border rounded-md px-3 py-2 text-sm w-80"
          placeholder="Filtrar por arquivo ou trecho..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-zinc-400">Nenhuma ocorrência para exibir.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left p-3 font-medium">Arquivo</th>
                <th className="text-left p-3 font-medium">Página</th>
                <th className="text-left p-3 font-medium">Evidência (snippet)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.key} className="border-t align-top">
                  <td className="p-3">{r.fileName}</td>
                  <td className="p-3 w-16">#{r.page}</td>
                  <td className="p-3">
                    <code className="bg-zinc-50 px-1 py-0.5 rounded">{r.snippet}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-500">
        As evidências são trechos do texto extraído (pdf.js + OCR) próximos da ocorrência encontrada.
      </div>
    </div>
  );
}
