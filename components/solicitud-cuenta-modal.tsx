"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Esquema de validación
const FormSchema = z
  .object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
    username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres."),
    email: z.string().email("Debe ser un correo electrónico válido."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmPassword: z.string(),
    cargo: z.string().min(2, "El cargo debe tener al menos 2 caracteres."),
    comentario: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof FormSchema>;

export function SolicitudCuentaModal() {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      cargo: "",
      comentario: "",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Solicitud enviada", {
          description: "Tu solicitud ha sido enviada correctamente.",
        });
        form.reset();
      } else {
        throw new Error("Error al enviar la solicitud");
      }
    } catch (error) {
      const errorMessage = 
        error instanceof Error 
          ? error.message 
          : "Hubo un error al enviar la solicitud. Inténtalo de nuevo.";
      
      toast.error("Error", {
        description: errorMessage,
      });
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-gray-600 hover:text-gray-800">
          Solicita una Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitud de Cuenta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apellido" render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de usuario</FormLabel>
                <FormControl>
                  <Input placeholder="Usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="correo@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Contraseña" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirmar Contraseña" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cargo" render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Cargo que desempeña" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="comentario" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Comentario</FormLabel>
                <FormControl>
                  <Textarea placeholder="¿Algo más que debamos saber?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="col-span-2 flex justify-end">
              <Button type="submit">Enviar Solicitud</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
