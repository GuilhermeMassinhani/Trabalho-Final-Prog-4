import { MenuBarAnalyzerItem } from "./MenuBarAnalyzerItem";
import { useFileContext } from "../../contexts/FilesContext";

export function NavAnalyzer() {
  const { result, searchResults} = useFileContext();

  // Fallbacks para valores padrão caso result ou suas propriedades estejam indefinidas
  const relationshipCount = Array.isArray(result?.results) ? result.results.length : 0;
  const pendingCount = Array.isArray(result?.no_cpf_cnpj_docs) ? result.no_cpf_cnpj_docs.length : 0;
  const documentCount = Array.isArray(result?.document_descriptions) ? result.document_descriptions.length : 0;
  const searchResultsCount = Array.isArray(searchResults) ? searchResults.length : 0;

  const resultsRelationShip = relationshipCount + searchResultsCount;

  return (
    <>
      <nav 
        className="flex gap-6 items-center">
        <MenuBarAnalyzerItem
          tittle="Tem relacionamento"
          linkTo="/relationship"
          occurrences={resultsRelationShip}
        />
        <MenuBarAnalyzerItem
          tittle="Pendente de análise"
          linkTo="/pendingAnalyze"
          occurrences={pendingCount}
        />
        <MenuBarAnalyzerItem
          tittle="Lista completa"
          linkTo="/documentDescription"
          occurrences={documentCount}
        />
      </nav>
    </>
  );
}
