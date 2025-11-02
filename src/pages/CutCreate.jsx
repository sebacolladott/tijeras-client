import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------- Config axios ----------
axios.defaults.withCredentials = true;

// ---------- Validación ----------
const schema = z.object({
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

// ---------- Conversión a WebP (con fallback para Safari) ----------
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
    // Fallback para navegadores sin createImageBitmap (ej: Safari iOS)
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

export default function CutCreate() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const [barbers, setBarbers] = useState([]);
  const fileInputRef = useRef(null);

  // ---------- Cargar barberos ----------
  useEffect(() => {
    axios
      .get("/barbers")
      .then((res) => setBarbers(res.data.data || []))
      .catch(() => toast.error("Error al cargar barberos"));
  }, []);

  // ---------- Enviar datos ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
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

        // cualquier imagen → WebP
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
        `📸 ${files.length} archivo${files.length > 1 ? "s" : ""} cargado${
          files.length > 1 ? "s" : ""
        }:\n${fileSummaries.join("\n")}`
      );
    }

    await toast.promise(axios.post("/cuts", formData), {
      loading: "Creando corte...",
      success: "Corte creado con éxito",
      error: (err) => {
        if (err.response) {
          return (
            err.response.data?.error ||
            `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`
          );
        } else if (err.request) {
          return "El servidor no respondió";
        } else {
          return `Error: ${err.message}`;
        }
      },
    });

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
          <FieldLegend>Nuevo corte</FieldLegend>
          <FieldDescription>
            Completá los datos del corte para este cliente.
          </FieldDescription>

          <FieldGroup className="space-y-6 mt-4">
            {/* Barbero */}
            <Field>
              <FieldLabel>Barbero *</FieldLabel>
              <Select
                value={form.watch("barberId")}
                onValueChange={(v) => form.setValue("barberId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un barbero" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.length ? (
                    barbers.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-muted-foreground text-sm">
                      No hay barberos registrados
                    </div>
                  )}
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.barberId?.message}</FieldError>
            </Field>

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
                placeholder="Ejemplo: Prefiere estilo clásico o detalles adicionales"
              />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            {/* Fotos */}
            <Field>
              <FieldLabel>Fotos</FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
              />
              <FieldDescription>
                Podés seleccionar varias imágenes (HEIC, JPG, PNG — se
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
            onClick={() => navigate(-1)}
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
