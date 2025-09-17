import { ComponentProps } from "react";

type InputPrefixProps = ComponentProps<'div'> 

type InputControlProps = ComponentProps<'input'>

type InputRootProps = ComponentProps<'div'>


export function InputPrefix (props: InputPrefixProps) {
    return  <div {...props} />
}

export function InputControl (props: InputControlProps) {
    return (
        <input 
        className= "flex-1 border-0 bg-transparent p-0 outline-none" 
        {...props} />
    )
}

export function InputRoot(props: InputRootProps) {
    return (
        <div 
            className="flex w-full mx-1 items-center gap-2 border-cinza-04 border px-3 py-2 rounded-lg shadow-sm"
            {...props}/>
    )
}