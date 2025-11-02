import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";

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

// ---------- Compresión y conversión ----------
async function processImage(file) {
  try {
    let image = file;

    // --- 1. HEIC → JPEG ---
    if (
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.endsWith(".heic") ||
      file.name.endsWith(".heif")
    ) {
      try {
        const converted = await heic2any({ blob: file, toType: "image/jpeg" });
        // heic2any devuelve un Blob, así que lo forzamos a File
        image = new File([converted], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.warn("Error convirtiendo HEIC:", err);
        toast.warning(`No se pudo convertir ${file.name} (HEIC)`);
      }
    }

    // --- 2. Asegurar que sea File válido ---
    if (!(image instanceof File)) {
      image = new File([image], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: image.type || "image/jpeg",
      });
    }

    // --- 3. Compresión ---
    const compressedBlob = await imageCompression(image, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    });

    // ⚠️ browser-image-compression a veces devuelve Blob sin tipo en iOS
    const mime =
      compressedBlob.type && compressedBlob.type !== ""
        ? compressedBlob.type
        : "image/webp";

    // --- 4. Reconvertir a File con tipo y nombre fijos ---
    const finalFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, ".webp"),
      { type: mime }
    );

    console.log("✅ Archivo final:", {
      name: finalFile.name,
      type: finalFile.type,
      size: finalFile.size,
    });

    return finalFile;
  } catch (err) {
    console.error("Error procesando imagen:", err);
    toast.warning(`No se pudo procesar ${file.name}, se enviará original`);
    return file;
  }
}

export default function CutCreate() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { barberId: "", style: "", notes: "" },
  });
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
        if (file.size > 25 * 1024 * 1024) {
          toast.warning(`"${file.name}" es muy grande (>25MB), se omitirá`);
          continue;
        }

        const processedFile = await processImage(file);

        // 🔹 Reforzamos tipo MIME válido
        const safeFile =
          processedFile.type &&
          processedFile.type !== "application/octet-stream"
            ? processedFile
            : new File([processedFile], processedFile.name, {
                type: "image/webp",
              });

        // 🔹 Safari necesita filename explícito
        formData.append("photos", safeFile, safeFile.name);

        fileSummaries.push(
          `${safeFile.name} (${(safeFile.size / 1024).toFixed(1)} KB)`
        );
      }

      toast.info(
        `📸 ${files.length} archivo${files.length > 1 ? "s" : ""} procesado${
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
                accept="image/*,.heic,.heif"
                multiple
                capture="environment"
              />
              <FieldDescription>
                Podés seleccionar varias imágenes (HEIC, JPG, PNG — se
                comprimirán y convertirán a WebP automáticamente).
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
