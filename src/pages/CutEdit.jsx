import { useEffect, useRef } from "react";
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
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/cuts/${cutId}`);
        const cut = res.data;
        form.reset({
          style: cut.style,
          notes: cut.notes,
        });
      } catch {
        toast.error("Error al cargar corte");
        navigate(`/clients/${id}`);
      }
    })();
  }, [cutId, form, navigate, id]);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("style", data.style);
      if (data.notes) formData.append("notes", data.notes);

      const files = fileInputRef.current?.files;
      if (files && files.length > 0) {
        for (const file of files) {
          let toSend = file;

          // ✅ Conversión HEIC → JPEG si viene de iPhone
          if (file.type === "image/heic" || file.name.endsWith(".heic")) {
            const blob = await fetch(URL.createObjectURL(file)).then((r) =>
              r.blob()
            );
            const imageBitmap = await createImageBitmap(blob);
            const canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imageBitmap, 0, 0);
            const convertedBlob = await new Promise((res) =>
              canvas.toBlob(res, "image/jpeg", 0.9)
            );
            toSend = new File(
              [convertedBlob],
              file.name.replace(/\.heic$/i, ".jpg"),
              {
                type: "image/jpeg",
              }
            );
          }

          formData.append("photos", toSend);
        }
      }

      await toast.promise(
        axios.put(`/cuts/${cutId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        {
          loading: "Actualizando corte...",
          success: "Corte actualizado con éxito",
          error: "Error al actualizar corte",
        }
      );

      navigate(`/clients/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al actualizar el corte");
    }
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
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            {/* Notas */}
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...form.register("notes")}
                placeholder="Ejemplo: Cliente pidió mantener el largo en la parte superior"
              />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            {/* Fotos */}
            <Field>
              <FieldLabel>Fotos</FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                capture="environment"
              />
              <FieldDescription>
                Podés seleccionar varias imágenes nuevas (HEIC, JPG, PNG).
              </FieldDescription>
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
