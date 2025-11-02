import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export default function ClientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/clients/${id}`);
        form.reset(res.data);
      } catch {
        toast.error("Error al cargar cliente");
        navigate("/clients");
      }
    })();
  }, [id, form, navigate]);

  const onSubmit = async (data) => {
    await toast.promise(axios.put(`/clients/${id}`, data), {
      loading: "Guardando cambios...",
      success: "Cliente actualizado con éxito",
      error: "Error al actualizar cliente",
    });
    navigate("/clients");
  };

  return (
    <div className="space-y-8 max-w-md">
      <h3 className="font-semibold text-lg">Editar cliente</h3>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input
            {...form.register("name")}
            placeholder="Ejemplo: Martín López"
          />
          <FieldDescription>
            Modificá el nombre completo del cliente.
          </FieldDescription>
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Teléfono</FieldLabel>
          <Input
            {...form.register("phone")}
            placeholder="Ejemplo: +54 9 264 512-3456"
          />
          <FieldDescription>
            Actualizá el número de contacto si es necesario.
          </FieldDescription>
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Notas</FieldLabel>
          <Input
            {...form.register("notes")}
            placeholder="Ejemplo: Prefiere cortes los viernes a la tarde"
          />
          <FieldDescription>
            Podés editar observaciones o comentarios del cliente.
          </FieldDescription>
          <FieldError>{form.formState.errors.notes?.message}</FieldError>
        </Field>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="w-28">
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-28"
            onClick={() => navigate("/clients")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
