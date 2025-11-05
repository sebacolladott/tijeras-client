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

import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Trash2Icon } from "lucide-react";

axios.defaults.withCredentials = true;

const schema = z.object({
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

const API = import.meta.env.VITE_API_URL;

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [barbers, setBarbers] = useState([]);
  const [cutData, setCutData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]); // fotos ya comprimidas
  const [progress, setProgress] = useState(0);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { barberId: "", style: "", notes: "" },
  });

  // ---------- Cargar datos ----------
  useEffect(() => {
    (async () => {
      try {
        const [barbersRes, cutRes] = await Promise.all([
          axios.get("/barbers"),
          axios.get(`/cuts/${cutId}`),
        ]);

        setBarbers(barbersRes.data.data || []);
        setCutData(cutRes.data);
        setPhotos(cutRes.data.photos || []);
      } catch {
        toast.error("Error al cargar datos del corte");
        navigate(`/clients/${id}`);
      }
    })();
  }, [cutId, id, navigate]);

  useEffect(() => {
    if (barbers.length && cutData) {
      form.reset({
        barberId: cutData.barberId || "",
        style: cutData.style || "",
        notes: cutData.notes || "",
      });
    }
  }, [barbers, cutData, form]);

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

  // ---------- Manejar nuevas fotos ----------
  const handleFilesChange = async (e) => {
    const selected = Array.from(e.target.files);
    const existing = photos.filter((p) => !p._deleted);
    const available = 3 - existing.length;

    if (available <= 0) {
      toast.error("Ya hay 3 fotos, eliminá alguna primero");
      e.target.value = "";
      return;
    }

    const limited = selected.slice(0, available);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setProcessedFiles([]);

    setProgress(10);
    const total = limited.length;
    const newPreviews = [];
    const processed = [];

    for (let i = 0; i < total; i++) {
      setProgress(((i + 1) / total) * 70);
      const normalized = await normalizeFile(limited[i]);
      const compressed = await compressImage(normalized);
      processed.push(compressed);
      newPreviews.push(URL.createObjectURL(compressed));
    }

    setProcessedFiles(processed);
    setPreviewUrls(newPreviews);
    setProgress(100);
    setTimeout(() => setProgress(0), 800);
  };

  // ---------- Envío ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const kept = photos.filter((p) => !p._deleted);
    const total = kept.length + processedFiles.length;
    if (total > 3) {
      toast.error("Máximo 3 fotos por corte");
      return;
    }

    // Reincorporar fotos viejas
    await Promise.all(
      kept.map(async (p) => {
        try {
          const res = await fetch(`${API}/cuts/${cutId}/photos/${p.id}/data`, {
            credentials: "include",
          });
          const blob = await res.blob();
          const file = new File([blob], `${p.id}.webp`, { type: blob.type });
          formData.append("photos", file);
        } catch {
          toast.warning(`No se pudo recuperar ${p.id}`);
        }
      })
    );

    // Agregar nuevas fotos ya comprimidas
    processedFiles.forEach((f) =>
      formData.append("photos", f, `${f.name.split(".")[0]}.webp`)
    );

    await toast.promise(
      axios.put(`/cuts/${cutId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
      {
        loading: "Actualizando corte...",
        success: "Corte actualizado con éxito",
        error: "Error al actualizar el corte",
      }
    );

    fileInputRef.current.value = "";
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setProcessedFiles([]);
    navigate(`/clients/${id}`);
  };

  const togglePhotoDelete = (id) =>
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, _deleted: !p._deleted } : p))
    );

  // ---------- Render ----------
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
          <FieldDescription>Actualizá los datos del corte.</FieldDescription>

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
                          No hay barberos
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
                placeholder="Ej: Fade medio"
              />
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            {/* Notas */}
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...form.register("notes")} placeholder="Opcional" />
            </Field>

            {/* Fotos actuales */}
            {photos.length > 0 && (
              <Field>
                <FieldLabel>Fotos actuales</FieldLabel>
                <PhotoProvider>
                  <div className="gap-3 grid grid-cols-2 sm:grid-cols-3">
                    {photos.map((p) => {
                      const url = `${API}/cuts/${cutId}/photos/${p.id}/data`;
                      return (
                        <div key={p.id} className="group relative">
                          <PhotoView src={url}>
                            <img
                              src={url}
                              alt=""
                              className={`border rounded-md aspect-square object-cover transition ${
                                p._deleted
                                  ? "opacity-50 border-destructive"
                                  : ""
                              }`}
                            />
                          </PhotoView>
                          <Button
                            size="icon"
                            variant={p._deleted ? "secondary" : "destructive"}
                            className="top-1 right-1 absolute opacity-90 w-6 h-6"
                            onClick={() => togglePhotoDelete(p.id)}
                            title={p._deleted ? "Deshacer" : "Eliminar"}
                          >
                            <Trash2Icon className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </PhotoProvider>
                <FieldDescription>
                  Tocá el botón rojo para eliminar o deshacer.
                </FieldDescription>
              </Field>
            )}

            {/* Fotos nuevas */}
            <Field>
              <FieldLabel>Fotos nuevas</FieldLabel>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleFilesChange}
              />
              <FieldDescription>
                Hasta 3 imágenes en total (HEIC, JPG, PNG, WebP)
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewUrls.map((u, i) => (
                    <img
                      key={i}
                      src={u}
                      className="border rounded w-24 h-24 object-cover"
                    />
                  ))}
                </div>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-28"
          >
            {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
