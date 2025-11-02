import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
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
  barberId: z.string().optional(), // no editable acá
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
  photos: z.any().optional(),
});

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/cuts/${cutId}`);
        const cut = res.data;
        form.reset({
          barberId: cut.barberId,
          style: cut.style,
          notes: cut.notes,
        });
      } catch {
        toast.error("Error al cargar corte");
        navigate(`/clients/${id}`);
      }
    })();
  }, [cutId, form, navigate, id]);

  useEffect(() => {
    return () => {
      const photos = form.watch("photos") || [];
      photos.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [form]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    // ✅ iPhone compatible
    for (const file of data.photos || []) {
      formData.append("photos", file);
    }

    await toast.promise(axios.put(`/cuts/${cutId}`, formData), {
      loading: "Actualizando corte...",
      success: "Corte actualizado con éxito",
      error: "Error al actualizar corte",
    });

    navigate(`/clients/${id}`);
  };

  return (
    <div className="space-y-8 max-w-md">
      <BackButton fallback={`/clients/${id}`} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FieldSet>
          <FieldLegend>Editar corte</FieldLegend>
          <FieldDescription>Modificá los datos del corte.</FieldDescription>

          <FieldGroup className="space-y-6 mt-4">
            {/* Estilo */}
            <Field>
              <FieldLabel>Estilo *</FieldLabel>
              <Textarea
                {...form.register("style")}
                placeholder="Ejemplo: Fade medio con navaja"
              />
              <FieldDescription>
                Modificá el tipo o estilo del corte realizado.
              </FieldDescription>
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            {/* Notas */}
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...form.register("notes")}
                placeholder="Ejemplo: Cliente pidió mantener el largo en la parte superior"
              />
              <FieldDescription>
                Agregá observaciones o detalles relevantes sobre el corte.
              </FieldDescription>
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            {/* Fotos */}
            <Field>
              <FieldLabel>Fotos</FieldLabel>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  form.setValue("photos", files);
                }}
              />
              {form.watch("photos")?.length > 0 && (
                <FieldDescription>
                  {form.watch("photos").length} foto(s) seleccionada(s)
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-28"
            onClick={() => navigate(`/clients/${id}`)}
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
