import { BarChart } from "lucide-react";
import { NavItem } from "./navItem";

export function Navigation () {
    return <>   
        <nav className="space-y-0.5">
            <NavItem link='/' showChevron={false} title= "Nova análise" icon={BarChart}/>
        </nav>
    </>
}