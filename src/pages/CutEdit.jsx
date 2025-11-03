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

import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Trash2Icon } from "lucide-react";

axios.defaults.withCredentials = true;

const schema = z.object({
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

export default function CutEdit() {
  const { id, cutId } = useParams();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { barberId: "", style: "", notes: "" },
  });
  const [barbers, setBarbers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [barbersRes, cutRes] = await Promise.all([
          axios.get("/barbers"),
          axios.get(`/cuts/${cutId}`),
        ]);
        setBarbers(barbersRes.data.data || []);
        const cut = cutRes.data;
        setPhotos(cut.photos || []);
        form.reset({
          barberId: cut.barberId || "",
          style: cut.style || "",
          notes: cut.notes || "",
        });
      } catch {
        toast.error("Error al cargar datos del corte");
        navigate(`/clients/${id}`);
      }
    })();
  }, [cutId, form, navigate, id]);

  // ---------- Normaliza HEIC ----------
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

  // ---------- Compresión ----------
  async function compressImage(file) {
    const options = {
      maxSizeMB: 0.6,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: "image/webp",
    };
    try {
      return await imageCompression(file, options);
    } catch (err) {
      console.error("Error al comprimir:", err);
      return file;
    }
  }

  // ---------- Envío ----------
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const removed = photos.filter((p) => p._deleted);
    removed.forEach((p) => formData.append("removePhotos[]", p.id));

    const files = fileInputRef.current?.files;
    let totalSize = 0;

    if (files && files.length > 0) {
      if (files.length > 3) {
        toast.error("Solo podés subir hasta 3 fotos nuevas");
        return;
      }

      const processed = [];
      for (const file of files) {
        try {
          const normalized = await normalizeFile(file);
          const compressed = await compressImage(normalized);
          totalSize += compressed.size;

          if (totalSize > 5 * 1024 * 1024) {
            toast.error("⚠️ Superás el límite total de 5 MB");
            break;
          }

          formData.append(
            "photos",
            compressed,
            `${file.name.split(".")[0]}.webp`
          );
          processed.push(compressed);
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

    navigate(`/clients/${id}`);
  };

  // ---------- Marcar para eliminar ----------
  const togglePhotoDelete = (photoId) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, _deleted: !p._deleted } : p))
    );
  };

  const API = import.meta.env.VITE_API_URL;

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
            {/* ---------- Barbero ---------- */}
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

            {/* ---------- Estilo ---------- */}
            <Field>
              <FieldLabel>Estilo *</FieldLabel>
              <Textarea
                {...form.register("style")}
                placeholder="Ej: Fade medio con navaja"
              />
              <FieldError>{form.formState.errors.style?.message}</FieldError>
            </Field>

            {/* ---------- Notas ---------- */}
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...form.register("notes")} placeholder="Opcional" />
              <FieldError>{form.formState.errors.notes?.message}</FieldError>
            </Field>

            {/* ---------- Fotos actuales ---------- */}
            {photos.length > 0 ? (
              <Field>
                <FieldLabel>Fotos actuales</FieldLabel>

                <PhotoProvider>
                  <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {photos.map((photo) => {
                      const url = `${API}/cuts/${cutId}/photos/${photo.id}/data`;

                      return (
                        <div key={photo.id} className="group relative">
                          <PhotoView src={url}>
                            <img
                              src={url}
                              alt="Foto del corte"
                              className={`group-hover:opacity-90 border rounded-md w-full object-cover aspect-square transition cursor-pointer ${
                                photo._deleted
                                  ? "opacity-50 border-destructive"
                                  : ""
                              }`}
                            />
                          </PhotoView>

                          <Button
                            size="icon"
                            variant={
                              photo._deleted ? "secondary" : "destructive"
                            }
                            className="top-1 right-1 absolute opacity-90 w-6 h-6"
                            onClick={() => togglePhotoDelete(photo.id)}
                            title={photo._deleted ? "Deshacer" : "Eliminar"}
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
            ) : (
              <p className="text-muted-foreground text-sm italic">Sin fotos</p>
            )}

            {/* ---------- Fotos nuevas ---------- */}
            <Field>
              <FieldLabel>Fotos nuevas</FieldLabel>
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
                Podés subir hasta 3 nuevas imágenes (HEIC, JPG, PNG, WebP).
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
