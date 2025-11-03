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

axios.defaults.withCredentials = true;

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

  useEffect(() => {
    axios
      .get("/barbers")
      .then((res) => setBarbers(res.data.data || []))
      .catch(() => toast.error("Error al cargar barberos"));
  }, []);

  // ---------- Conversión universal ----------
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
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const mime =
            canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
              ? "image/webp"
              : "image/jpeg";

          canvas.toBlob(
            (blob) => {
              if (!blob)
                return reject(new Error("No se pudo convertir la imagen"));
              if (blob.size > 500 * 1024 && quality > 0.3) {
                resolve(
                  convertToWebP(file, maxWidth, maxHeight, quality - 0.1)
                );
              } else resolve(blob);
            },
            mime,
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

  // ---------- Normaliza HEIC / iOS ----------
  async function normalizeFile(file) {
    if (
      file.type === "image/heic" ||
      file.name.toLowerCase().endsWith(".heic")
    ) {
      try {
        const blob = await heic2any({ blob: file, toType: "image/jpeg" });
        return new File([blob], file.name.replace(/\.heic$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (e) {
        console.warn("Error convirtiendo HEIC:", e);
        return file;
      }
    }
    return file;
  }

  // ---------- Envío ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const files = fileInputRef.current?.files;
    let totalSize = 0;

    if (files && files.length > 0) {
      if (files.length > 3) {
        toast.error("Solo podés subir hasta 3 fotos");
        return;
      }

      const processed = [];

      for (const file of files) {
        try {
          const normalized = await normalizeFile(file);
          const webp = await convertToWebP(normalized);
          totalSize += webp.size;

          if (totalSize > 5 * 1024 * 1024) {
            toast.error("⚠️ Superás el límite total de 5 MB");
            break;
          }

          formData.append("photos", webp, `${file.name.split(".")[0]}.webp`);
          processed.push(webp);
        } catch (err) {
          console.error("❌ Error procesando imagen:", file.name, err);
          toast.error(`No se pudo procesar "${file.name}"`);
        }
      }

      if (processed.length) {
        toast.info(
          `📸 ${processed.length} imagen${
            processed.length > 1 ? "es" : ""
          } lista${processed.length > 1 ? "s" : ""}`
        );
      }
    }

    await toast.promise(axios.post("/cuts", formData), {
      loading: "Creando corte...",
      success: "Corte creado con éxito",
      error: "Error al crear el corte",
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
          <FieldDescription>Completá los datos del corte.</FieldDescription>

          <FieldGroup className="space-y-6 mt-4">
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

            <Field>
              <FieldLabel>Estilo *</FieldLabel>
              <Textarea
                {...form.register("style")}
                placeholder="Ej: Fade medio con navaja"
              />
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...form.register("notes")} placeholder="Opcional" />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Fotos</FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={(e) => {
                  if (e.target.files.length > 3) {
                    toast.error("Solo podés subir hasta 3 fotos");
                    e.target.value = "";
                  }
                }}
              />
              <FieldDescription>
                Hasta 3 imágenes (HEIC, JPG, PNG).
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
