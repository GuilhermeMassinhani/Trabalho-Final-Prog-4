import { useFileContext } from "../../contexts/FilesContext";
import { NavLink } from "react-router-dom"; // Substitua Link por NavLink

interface NavAnalyzerProps {
  tittle: string;
  linkTo: string;
  occurrences: number;
}

export function MenuBarAnalyzerItem({ tittle, linkTo, occurrences }: NavAnalyzerProps) {
  const { isLoading } = useFileContext();

  return (
    <div aria-disabled={isLoading} className="flex items-center gap-2">
      <NavLink
        to={isLoading ? "#" : linkTo} // Evita navegação se isLoading for true
        onClick={(e) => {
          if (isLoading) {
            e.preventDefault(); // Impede a navegação
          }
        }}
        className={({ isActive }) =>
          `transition delay-150 ease-in-out p-2 text-sm ${
            isActive
              ? "text-azulReal-CMYK font-bold" // Classe para o link ativo
              : "text-chumbo-01"
          } ${isLoading ? "cursor-not-allowed hover:text-cinza-04" : "hover:text-azulReal-CMYK"}`
        }
      >
        {tittle}
      </NavLink>

      <div className="flex select-none items-center justify-center bg-zinc-100 text-zinc-700 text-xs w-5 h-5 rounded-full">
        {occurrences}
      </div>
    </div>
  );
}
