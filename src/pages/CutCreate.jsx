"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";
import { Progress } from "@/components/ui/progress";

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
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [barbers, setBarbers] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { barberId: "", style: "", notes: "" },
  });

  // ---------- Cargar barberos ----------
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/barbers");
        setBarbers(res.data.data || []);
      } catch {
        toast.error("Error al cargar barberos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Normaliza HEIC ----------
  async function normalizeFile(file) {
    if (file.type.includes("heic")) {
      try {
        const blob = await heic2any({ blob: file, toType: "image/jpeg" });
        return new File([blob], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch {
        toast.error(`Error convirtiendo ${file.name}`);
      }
    }
    return file;
  }

  // ---------- Compresión ----------
  async function compressImage(file) {
    try {
      return await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/webp",
      });
    } catch {
      toast.error(`Error al comprimir ${file.name}`);
      return file;
    }
  }

  // ---------- Previews con progreso ----------
  const handleFilesChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) {
      toast.error("Solo podés subir hasta 3 fotos");
      e.target.value = "";
      setPreviewUrls([]);
      return;
    }

    setProgress(5);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));

    const total = selected.length;
    const newPreviews = [];

    for (let i = 0; i < total; i++) {
      const file = selected[i];
      setProgress(((i + 1) / total) * 50); // progreso intermedio
      const normalized = await normalizeFile(file);
      const compressed = await compressImage(normalized);
      newPreviews.push(URL.createObjectURL(compressed));
    }

    setPreviewUrls(newPreviews);
    setProgress(100);
    setTimeout(() => setProgress(0), 1000); // resetea visualmente después de 1s
  };

  // ---------- Envío ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const files = fileInputRef.current?.files;
    if (files && files.length > 0) {
      const limited = Array.from(files).slice(0, 3);
      const processed = await Promise.all(
        limited.map(async (file) => compressImage(await normalizeFile(file)))
      );
      processed.forEach((f) =>
        formData.append("photos", f, `${f.name.split(".")[0]}.webp`)
      );
    }

    await toast.promise(axios.post("/cuts", formData), {
      loading: "Creando corte...",
      success: "Corte creado con éxito",
      error: (err) => err.response?.data?.error || "Error al crear el corte",
    });

    form.reset();
    fileInputRef.current.value = "";
    setPreviewUrls([]);
    navigate(`/clients/${id}`);
  };

  if (loading)
    return (
      <div className="py-16 max-w-md text-muted-foreground text-center">
        Cargando barberos...
      </div>
    );

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
            {/* Barbero */}
            <Field>
              <FieldLabel>Barbero *</FieldLabel>
              <Controller
                control={form.control}
                name="barberId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná un barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers.length ? (
                        barbers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
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
                )}
              />
              <FieldError>{form.formState.errors.barberId?.message}</FieldError>
            </Field>

            {/* Estilo */}
            <Field>
              <FieldLabel>Estilo *</FieldLabel>
              <Textarea
                {...form.register("style")}
                placeholder="Ej: Fade medio con navaja"
              />
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            {/* Notas */}
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...form.register("notes")} placeholder="Opcional" />
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
                onChange={handleFilesChange}
              />
              <FieldDescription>
                Hasta 3 imágenes (HEIC, JPG, PNG, WebP).
              </FieldDescription>

              {/* Barra de progreso */}
              {progress > 0 && (
                <div className="mt-2">
                  <Progress value={progress} className="w-full" />
                  <p className="mt-1 text-muted-foreground text-xs text-center">
                    {progress < 100
                      ? "Procesando imágenes..."
                      : "✅ Imágenes listas para subir"}
                  </p>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="border rounded w-24 h-24 object-cover"
                    />
                  ))}
                </div>
              )}
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
          <Button
            type="submit"
            className="w-28"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
