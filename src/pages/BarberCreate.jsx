import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  bio: z.string().optional(),
});

export default function BarberCreate() {
  const navigate = useNavigate();
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", bio: "" },
  });

  const onSubmit = async (data) => {
    await toast.promise(axios.post("/barbers", data), {
      loading: "Creando barbero...",
      success: "Barbero creado con éxito",
      error: "Error al crear barbero",
    });
    navigate("/barbers");
  };

  return (
    <div className="space-y-8 max-w-md">
      <BackButton fallback="/barbers" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FieldSet>
          <FieldLegend>Nuevo barbero</FieldLegend>
          <FieldDescription>
            Completá los datos para registrar un nuevo barbero en el sistema.
          </FieldDescription>

          <FieldGroup className="space-y-6 mt-4">
            <Field>
              <FieldLabel>Nombre *</FieldLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Juan Pérez" />
                )}
              />
              <FieldDescription>
                Escribí el nombre completo del barbero.
              </FieldDescription>
              <FieldError>{formState.errors.name?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Biografía</FieldLabel>
              <Controller
                name="bio"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Especialista en cortes fade y barbas. Más de 5 años de experiencia en el rubro."
                    rows={4}
                  />
                )}
              />
              <FieldDescription>
                Incluí una breve descripción sobre su experiencia o estilo.
              </FieldDescription>
              <FieldError>{formState.errors.bio?.message}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-28"
            onClick={() => navigate("/barbers")}
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
