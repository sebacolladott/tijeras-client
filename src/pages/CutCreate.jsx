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

const schema = z.object({
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
});

export default function CutCreate() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const [barbers, setBarbers] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/barbers");
        setBarbers(res.data.data || []);
      } catch {
        toast.error("Error al cargar barberos");
      }
    })();
  }, []);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("clientId", id);
      formData.append("barberId", data.barberId);
      formData.append("style", data.style);
      if (data.notes) formData.append("notes", data.notes);

      // ✅ Manejo de archivos compatible con iOS
      const files = fileInputRef.current?.files;
      if (files && files.length > 0) {
        for (const file of files) {
          let toSend = file;

          // Conversión HEIC → JPEG si hace falta
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
        axios.post("/cuts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        {
          loading: "Subiendo fotos...",
          success: "Corte creado con éxito",
          error: "Error al crear corte",
        }
      );

      navigate(`/clients/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al subir fotos");
    }
  };

  return (
    <div className="space-y-8 max-w-md">
      <BackButton fallback={`/clients/${id}`} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
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
                Podés seleccionar varias imágenes (HEIC, JPG, PNG).
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
