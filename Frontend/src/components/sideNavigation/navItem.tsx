import { ChevronDown } from "lucide-react";
import { ElementType } from "react";

export interface NavItemProps {
    title: string,
    icon: ElementType,
    targetBlank?: boolean,
    showChevron: boolean,
    link: string
};

export function NavItem ({title, icon: Icon, showChevron, targetBlank, link}: NavItemProps) {
    return (

        <a
        className="group flex items-center gap-3 rounded px-3 py-2 hover:bg-cinza-03" 
        href={link}
        rel={targetBlank ? "noopener noreferrer" : undefined}
        target={targetBlank ? "_blank" : "_self"}
        >
        
            <Icon className="h-5 w-5 text-gray group-hover:text-azulReal-CMYK"/>
            <span className="font-medium text-gray group-hover:text-azulReal-CMYK ">
                {title}
            </span>
            {showChevron && (
                <ChevronDown className="ml-auto w-5 h-5 group-hover:text-azulReal-RGB"/>
            )}
        </a>
    )
}