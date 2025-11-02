import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
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
  photos: z.any().optional(),
});

export default function CutCreate() {
  const { id } = useParams(); // clientId
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });
  const [barbers, setBarbers] = useState([]);

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

  useEffect(() => {
    return () => {
      const photos = form.watch("photos") || [];
      photos.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [form]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);
    for (const { file } of data.photos || []) formData.append("photos", file);

    await toast.promise(axios.post("/cuts", formData), {
      loading: "Creando corte...",
      success: "Corte creado con éxito",
      error: "Error al crear corte",
    });

    navigate(`/clients/${id}`);
  };

  return (
    <div className="space-y-8 max-w-md">
      <h3 className="font-semibold text-lg">Nuevo corte</h3>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          <FieldDescription>
            Elegí el barbero que realizó el corte.
          </FieldDescription>
          <FieldError>{form.formState.errors.barberId?.message}</FieldError>
        </Field>

        {/* Estilo */}
        <Field>
          <FieldLabel>Estilo *</FieldLabel>
          <Input
            {...form.register("style")}
            placeholder="Ejemplo: Fade medio con navaja"
          />
          <FieldDescription>
            Especificá el tipo o estilo del corte realizado.
          </FieldDescription>
          <FieldError>{form.formState.errors.style?.message}</FieldError>
        </Field>

        {/* Notas */}
        <Field>
          <FieldLabel>Notas</FieldLabel>
          <Input
            {...form.register("notes")}
            placeholder="Ejemplo: Prefiere estilo clásico o detalles adicionales"
          />
          <FieldDescription>
            Agregá observaciones relevantes sobre el corte.
          </FieldDescription>
          <FieldError>{form.formState.errors.notes?.message}</FieldError>
        </Field>

        {/* Fotos */}
        <Field>
          <FieldLabel>Fotos</FieldLabel>
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []).map((f) => ({
                file: f,
                preview: URL.createObjectURL(f),
              }));
              form.setValue("photos", files);
            }}
          />
          {form.watch("photos")?.length > 0 && (
            <FieldDescription>
              {form.watch("photos").length} foto(s) seleccionada(s)
            </FieldDescription>
          )}
        </Field>

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
