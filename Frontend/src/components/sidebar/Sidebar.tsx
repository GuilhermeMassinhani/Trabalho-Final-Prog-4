import { LifeBuoy } from "lucide-react";
import { Navigation } from "../sideNavigation/navigation";
import { NavItem } from "../sideNavigation/navItem";
import { SpaceFooter } from "./SpaceFooter";
import { Profile } from "./Profile";

export function Sidebar () {

    return (
        <>
        <aside className=" max-h-full border-r h- border-r-cinza-04 flex flex-col gap-6 px-5 py-12">
          {/*
            O InputRoot foi desativado porque o recurso de busca ainda não está 
            implementado.
        */}

          {/* 
          <InputRoot>
            <InputPrefix>
              <Search className="h-5 w-5 text-gray " />
            </InputPrefix>
            <InputControl placeholder="Buscar" />
          </InputRoot> 
          */}
          <Navigation/>

          <div className="mt-auto flex flex-col gap-6">
            <nav className="space-y-1">
              <NavItem showChevron= {false} targetBlank={true} link='https://http.cat/' title= "Contatar o Suporte" icon= {LifeBuoy}/>
            </nav>
          </div>
              <SpaceFooter/>
          <div className="h-px bg-cinza-05"></div>
          <Profile/>
        </aside>

        </>
    )
}
