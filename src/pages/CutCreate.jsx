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
  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("clientId", id);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    const files = fileInputRef.current?.files;
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size > 25 * 1024 * 1024) {
          toast.warning(`"${file.name}" es muy grande (>25MB), se omitirá`);
          continue;
        }
        formData.append("photos", file, file.name);
      }
      toast.info(
        `📸 ${files.length} archivo${files.length > 1 ? "s" : ""} agregado${
          files.length > 1 ? "s" : ""
        }`
      );
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
