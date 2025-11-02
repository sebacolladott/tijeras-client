import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  bio: z.string().optional(),
});

export default function BarberEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/barbers/${id}`);
        form.reset(res.data);
      } catch {
        toast.error("Error al cargar barbero");
        navigate("/barbers");
      }
    })();
  }, [id, form, navigate]);

  const onSubmit = async (data) => {
    await toast.promise(axios.put(`/barbers/${id}`, data), {
      loading: "Guardando cambios...",
      success: "Barbero actualizado con éxito",
      error: "Error al actualizar barbero",
    });
    navigate("/barbers");
  };

  return (
    <div className="space-y-8 max-w-md">
      <h3 className="font-semibold text-lg">Editar barbero</h3>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input {...form.register("name")} placeholder="Ejemplo: Juan Pérez" />
          <FieldDescription>
            Modificá el nombre completo del barbero.
          </FieldDescription>
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Biografía</FieldLabel>
          <Textarea
            {...form.register("bio")}
            placeholder="Ejemplo: Experto en cortes fade y barbas. Más de 5 años de experiencia."
            rows={4}
          />
          <FieldDescription>
            Podés actualizar la descripción o experiencia del barbero.
          </FieldDescription>
          <FieldError>{form.formState.errors.bio?.message}</FieldError>
        </Field>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="w-28">
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-28"
            onClick={() => navigate("/barbers")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
