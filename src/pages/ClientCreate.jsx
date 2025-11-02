import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export default function ClientCreate() {
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const onSubmit = async (data) => {
    await toast.promise(axios.post("/clients", data), {
      loading: "Guardando cliente...",
      success: "Cliente creado con éxito",
      error: "Error al crear cliente",
    });
    navigate("/clients");
  };

  return (
    <div className="space-y-8 max-w-md">
      <BackButton fallback="/clients" />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FieldSet>
          <FieldLegend>Nuevo cliente</FieldLegend>
          <FieldDescription>
            Completá los datos para registrar un nuevo cliente.
          </FieldDescription>

          <FieldGroup className="space-y-6 mt-4">
        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input
            {...form.register("name")}
            placeholder="Ejemplo: Martín López"
          />
          <FieldDescription>
            Escribí el nombre completo del cliente.
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
            Ingresá un número de contacto (opcional).
          </FieldDescription>
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Notas</FieldLabel>
          <Textarea
            {...form.register("notes")}
            placeholder="Ejemplo: Prefiere turnos los viernes por la tarde"
            rows={4}
          />
          <FieldDescription>
            Agregá observaciones o detalles relevantes sobre el cliente.
          </FieldDescription>
          <FieldError>{form.formState.errors.notes?.message}</FieldError>
        </Field>

          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-28"
            onClick={() => navigate("/clients")}
          >
            Cancelar
          </Button>
          <Button type="submit" className="w-28">
            Guardar
          </Button>
        </div>
      </form>
    </div>
  );
}
