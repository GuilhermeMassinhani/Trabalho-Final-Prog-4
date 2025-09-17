import { Button } from "../components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "../components/ui/alert-dialog"
import { useFileContext } from "../contexts/FilesContext"

export const AlertDialogButton = () => {
    const { clearSearch, isLoading } = useFileContext();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="border disabled:bg-cinza-04 w-max disabled:cursor-not-allowed text-sm font-medium p-2 ease-in-out delay-150 bg-azulReal-CMYK text-white rounded-xl hover:bg-azulReal-RGB transition"
                    disabled={isLoading}
                >Limpar busca</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação vai limpar toda a análise já feita para que 
                        você possa realizar uma nova busca.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction  
                        onClick={clearSearch} 
                    >
                        Tenho certeza
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}