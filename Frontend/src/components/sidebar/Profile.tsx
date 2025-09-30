import { Avatar } from "@radix-ui/themes";

export function Profile () {
    return (
        
        <div className="grid grid-cols-profile bg-green-500 p-4 text-white rounded-lg items-center gap-4">
               <Avatar size="2" fallback="R"/>
            <div className="flex flex-col truncate">
                <span className="text-sm truncate font-semibold ">
                    Rob
                </span>
                <span className="text-xs truncate text-white font-semibold">
                    Analisador de Documentos
                </span>
            </div>

            
            {/*<button type="button" className="ml-auto p-2 hover:bg-cinza-01 rounded-md">
                <LogOut className="h-5 w-5 text-gray"/>
            </button>*/}
        </div>
    )
}