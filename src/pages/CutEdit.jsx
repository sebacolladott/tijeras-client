import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import heic2any from "heic2any";

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

// ✅ Validación
const schema = z.object({
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

// ✅ Conversión genérica a WebP
async function convertToWebP(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", 0.9)
  );
}

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const fileInputRef = useRef(null);

  // 🔹 Cargar datos existentes
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

  // 🔹 Enviar datos actualizados
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("style", data.style);
      if (data.notes) formData.append("notes", data.notes);

      const files = fileInputRef.current?.files;
      if (files && files.length > 0) {
        for (const file of files) {
          let imageBlob = file;

          // 🔧 Convertir HEIC/HEIF → JPEG
          if (
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            file.name.endsWith(".heic") ||
            file.name.endsWith(".heif")
          ) {
            try {
              imageBlob = await heic2any({ blob: file, toType: "image/jpeg" });
            } catch (err) {
              console.error("Error convirtiendo HEIC/HEIF:", err);
            }
          }

          // 🔧 Convertir todo a WebP
          try {
            const webpBlob = await convertToWebP(imageBlob);
            const webpFile = new File(
              [webpBlob],
              file.name.replace(/\.[^.]+$/, ".webp"),
              { type: "image/webp" }
            );
            formData.append("photos", webpFile);
          } catch (err) {
            console.error("Error convirtiendo a WebP:", err);
            formData.append("photos", file); // fallback
          }
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

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        encType="multipart/form-data"
      >
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
                Podés seleccionar nuevas imágenes (HEIC, JPG, PNG — se
                convertirán a WebP automáticamente).
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
