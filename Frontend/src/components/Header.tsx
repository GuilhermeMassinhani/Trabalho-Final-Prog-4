export const Header = () => {

    return(

    <div className=" flex flex-col ">
        <header className="p-4 ml-2">
            <h1 className="text-3xl font-medium leading-9"> Rob</h1>
        </header>
        <nav className=" ml-2 flex mt-auto border-solid border-b p-4 text-cinza-04 ">
            <span className="pb-4 hover:text-azulReal-RGB hover:cursor-default hover:border-azulReal-RGB font-medium leading-4 text-azulReal-CMYK border-solid border-b">Analisador de documentos</span>
        </nav>
    </div>
    )
}

