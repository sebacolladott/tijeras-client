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

// ---------- Validación ----------
const schema = z.object({
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

// ---------- Conversión a WebP (con fallback para Safari/iOS) ----------
async function convertToWebP(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.9)
    );
  } catch {
    // fallback si createImageBitmap no está disponible
    const img = document.createElement("img");
    const url = URL.createObjectURL(blob);
    await new Promise((r) => {
      img.onload = r;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve) =>
      canvas.toBlob(
        (b) => {
          URL.revokeObjectURL(url);
          resolve(b);
        },
        "image/webp",
        0.9
      )
    );
  }
}

// ---------- Axios Config ----------
axios.defaults.withCredentials = true;

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const fileInputRef = useRef(null);

  // ---------- Cargar datos existentes ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/cuts/${cutId}`);
        const cut = res.data;
        form.reset({
          style: cut.style || "",
          notes: cut.notes || "",
        });
      } catch {
        toast.error("Error al cargar corte");
        navigate(`/clients/${id}`);
      }
    })();
  }, [cutId, form, navigate, id]);

  // ---------- Enviar actualización ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const files = fileInputRef.current?.files;
    const fileSummaries = [];

    if (files && files.length > 0) {
      for (const file of files) {
        let imageBlob = file;

        // HEIC → JPEG
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
            toast.warning(`No se pudo convertir ${file.name} (HEIC)`);
          }
        }

        // Cualquier formato → WebP
        try {
          const webpBlob = await convertToWebP(imageBlob);
          const webpFile = new File(
            [webpBlob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            { type: "image/webp" }
          );
          formData.append("photos", webpFile);
          fileSummaries.push(
            `${webpFile.name} (${(webpFile.size / 1024).toFixed(1)} KB)`
          );
        } catch (err) {
          console.error("Error convirtiendo a WebP:", err);
          toast.warning(
            `No se pudo convertir ${file.name}, se enviará original`
          );
          formData.append("photos", file);
          fileSummaries.push(`${file.name} (sin conversión)`);
        }
      }

      toast.info(
        `📸 ${files.length} archivo${files.length > 1 ? "s" : ""} actualizado${
          files.length > 1 ? "s" : ""
        }:\n${fileSummaries.join("\n")}`
      );
    }

    await toast.promise(
      axios.put(`/cuts/${cutId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
      {
        loading: "Actualizando corte...",
        success: "Corte actualizado con éxito",
        error: (err) =>
          err.response?.data?.error ||
          `Error ${err.response?.status || ""}: ${
            err.response?.data?.message || "Error desconocido"
          }`,
      }
    );

    navigate(`/clients/${id}`);
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
          <FieldDescription>
            Modificá los datos o agregá nuevas fotos al corte.
          </FieldDescription>

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
                placeholder="Ejemplo: Mantener largo superior"
              />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            {/* Fotos */}
            <Field>
              <FieldLabel>Fotos nuevas</FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                capture="environment"
              />
              <FieldDescription>
                Podés agregar más imágenes (HEIC, JPG, PNG — se convertirán a
                WebP automáticamente).
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
