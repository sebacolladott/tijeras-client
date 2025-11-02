import { useEffect, useRef, useState } from "react";
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
  // ---------- Enviar datos ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const files = fileInputRef.current?.files;
    if (files && files.length > 0) {
      const convertedFiles = [];

      for (const file of files) {
        if (file.size > 25 * 1024 * 1024) {
          toast.warning(`"${file.name}" es muy grande (>25MB), se omitirá`);
          continue;
        }

        try {
          const convertedBlob = await convertToWebP(file);
          convertedFiles.push(convertedBlob);
          formData.append(
            "photos",
            convertedBlob,
            `${file.name.split(".")[0]}.jpg`
          );
        } catch (error) {
          console.error(`Error convirtiendo ${file.name}:`, error);
          toast.error(`No se pudo procesar "${file.name}"`);
        }
      }

      if (convertedFiles.length > 0) {
        toast.info(
          `📸 ${convertedFiles.length} imagen${
            convertedFiles.length > 1 ? "es" : ""
          } convertida${convertedFiles.length > 1 ? "s" : ""} a JPG`
        );
      }
    }

    await toast.promise(axios.post("/cuts", formData), {
      loading: "Creando corte...",
      success: "Corte creado con éxito",
      error: (err) => {
        console.error("❌ Error completo:", err);

        if (err.response) {
          console.error("📨 Respuesta del servidor:", err.response.data);
          console.error("📋 Status:", err.response.status);
          console.error("🔗 Headers:", err.response.headers);
          return (
            err.response.data?.error ||
            `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`
          );
        } else if (err.request) {
          console.error("📡 No hubo respuesta del servidor:", err.request);
          return "El servidor no respondió";
        } else {
          console.error("⚠️ Error al configurar la solicitud:", err.message);
          return `Error: ${err.message}`;
        }
      },
    });

    navigate(`/clients/${id}`);
  };

  // ---------- Función para convertir a JPG ----------
  const convertToWebP = (
    file,
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.55
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

          // Redimensionar manteniendo proporción
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          // Fondo blanco (por si vienen imágenes con transparencia)
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Si sigue pesando demasiado, reintenta con menos calidad
                if (blob.size > 500 * 1024 && quality > 0.3) {
                  console.log("Reintentando con menor calidad...");
                  resolve(
                    convertToWebP(file, maxWidth, maxHeight, quality - 0.1)
                  );
                } else {
                  resolve(blob);
                }
              } else reject(new Error("No se pudo convertir la imagen"));
            },
            "image/webp",
            quality
          );
        };

        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
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
              />
              <FieldDescription>
                Podés seleccionar varias imágenes (HEIC, JPG, PNG, etc.).
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
