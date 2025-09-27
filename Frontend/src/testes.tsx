import { Button } from "@/components/ui/button";
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

//interface IformValues {
//    name: string;
//    email: string;
//}

const formSchema = z.object ({
    name: z.string().min(3, {message: 'Nome deve ter pelo menos 3 caracteres'}),
    email: z.string().email({message: 'Email inválido'}),
})

type IFormValues = Zod.infer<typeof formSchema>
export const Testes = () => {
    const { register, handleSubmit, formState, reset } = useForm<IFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { 
         email: '',
         name: ''
        }
    });
    function handleCreateNewCycle (data:IFormValues) {
        console.log(data);
        reset();
    }

    console.log(formState.errors)

    return <>
        <h1>Teste</h1>
        <Dialog>
            <DialogTrigger>
                <Button>
                    Abrir
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Testando</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    Favor confirmar os dados antes de enviar
                </DialogDescription>
                <form onSubmit={handleSubmit(handleCreateNewCycle)} className="gap-2 flex flex-col">
                    <div>
                        <Label>Nome:</Label>
                        <Input type="text" {...register('name')} />
                    </div>
                  <div>
                    <Label>Email:</Label>
                    <Input type="email" {...register('email')} />
                  </div>
                  
                        <Button type="submit">Enviar</Button>
                </form>
            </DialogContent>
        </Dialog>
    </>
}