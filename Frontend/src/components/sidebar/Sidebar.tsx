import { LifeBuoy } from "lucide-react";
import { Navigation } from "../sideNavigation/navigation";
import { NavItem } from "../sideNavigation/navItem";
import { SpaceFooter } from "./SpaceFooter";
import { Profile } from "./Profile";

export function Sidebar () {

    return (
        <>
        <aside className=" max-h-full border-r h- border-r-zinc-200 flex flex-col gap-6 px-5 py-12">
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
