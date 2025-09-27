import { MenuBarAnalyzerItem } from "./MenuBarAnalyzerItem";
import { useFileContext } from "../../contexts/FilesContext";

export function NavAnalyzer() {
  const { files, analyses } = useFileContext();

  // Arquivos
  const totalFiles = files.length;

  // Já analisados
  const analyzedNames = Object.keys(analyses || {});
  const analyzedCount = analyzedNames.length;

  // Pendentes = enviados mas ainda não analisados
  const pendingCount = Math.max(0, totalFiles - analyzedCount);

  // Ocorrências totais (soma de todas as matches)
  const totalOccurrences = analyzedNames.reduce((acc, name) => {
    const a = analyses[name];
    return acc + (a?.matches?.length || 0);
    // Se preferir contar APENAS arquivos com pelo menos 1 match:
    // return acc + ((a?.matches?.length || 0) > 0 ? 1 : 0);
  }, 0);

  return (
    <nav className="flex gap-6 items-center">
      <MenuBarAnalyzerItem
        tittle="Ocorrências encontradas"
        linkTo="/relationship"
        occurrences={totalOccurrences}
      />
      <MenuBarAnalyzerItem
        tittle="Análise manual"
        linkTo="/pendingAnalyze"
        occurrences={pendingCount}
      />
      <MenuBarAnalyzerItem
        tittle="Lista completa"
        linkTo="/documentDescription"
        occurrences={totalFiles}
      />
    </nav>
  );
}
