"use client";

// Página de detalle de Cliente con filtro único `q`, Drawer de EDITAR cliente
// y Drawer para registrar un nuevo corte, unificada a la misma estructura.

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import axios from "@/lib/axios";

/* shadcn/ui */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel as FormFieldLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  PlusIcon,
  Trash2,
  UserIcon,
  Brush,
  Pencil,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

/* ---------- utils ---------- */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const toISODate = (s) => (s || "").slice(0, 10);

/* ---------- Schemas ---------- */
const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const clientEditSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const cutForClientSchema = z.object({
  barberId: z.string().min(1, "Selecciona un barbero"),
  style: z.string().min(1, "Servicio requerido"),
  notes: z.string().optional(),
});

/* ---------- Búsqueda unificada ---------- */
function parseQuery(q) {
  const src = norm(q);
  const mBarbero = src.match(/\bbarbero:([^\s]+)/)?.[1] || "";
  const mDesde = src.match(/\bdesde:(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const mHasta = src.match(/\bhasta:(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const mOrden = src.match(/\borden:(asc|desc)\b/)?.[1] || "";

  const cleaned = src
    .replace(/\bbarbero:[^\s]+/g, "")
    .replace(/\bdesde:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\bhasta:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\borden:(asc|desc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    cleaned,
    barberTok: mBarbero,
    from: mDesde,
    to: mHasta,
    order: mOrden || "desc",
  };
}

function buildHaystack(cut, barbers) {
  const barber =
    barbers.find((b) => String(b.id) === String(cut.barberId)) || {};
  const barberName = barber.name || "";
  const style = cut.style || "";
  const notes = cut.notes || "";
  const idText = String(cut.id || "");
  const d = cut.date ? new Date(cut.date) : null;
  const fechaCorta = d ? d.toLocaleDateString("es-AR") : "";
  const fechaLocal = d ? d.toLocaleString("es-AR") : "";
  const fechaISO = d ? d.toISOString() : "";
  return norm(
    [barberName, style, notes, idText, fechaCorta, fechaLocal, fechaISO].join(
      " | "
    )
  );
}

function tokensMatchAll(hay, text) {
  if (!text) return true;
  const toks = text.split(/\s+/).filter(Boolean);
  return toks.every((t) => hay.includes(t));
}

/* ---------- Página ---------- */
function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [cuts, setCuts] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [q, setQ] = useState("");

  const formNew = useForm({
    resolver: zodResolver(cutForClientSchema),
    defaultValues: { barberId: "", style: "", notes: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(clientEditSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const onInvalid = (errs) => {
    const first = Object.values(errs || {})[0];
    toast.error(first?.message || "Revisá los campos marcados.");
  };

  const fetchAll = async () => {
    const [cRes, cutsRes, bRes] = await Promise.all([
      axios.get(`/clients/${id}`),
      axios.get(`/cuts`, { params: { clientId: id } }),
      axios.get(`/barbers`).catch(() => ({ data: [] })),
    ]);
    const parsedClient = clientSchema.parse(cRes.data);
    setClient(parsedClient);
    setCuts(Array.isArray(cutsRes.data) ? cutsRes.data : []);
    setBarbers(Array.isArray(bRes.data) ? bRes.data : []);

    formEdit.reset({
      name: parsedClient.name || "",
      phone: parsedClient.phone || "",
      notes: parsedClient.notes || "",
    });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchAll();
      } catch {
        toast.error("No se pudo cargar el cliente");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (client) {
      formEdit.reset({
        name: client.name || "",
        phone: client.phone || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  /* ---------- Acciones ---------- */
  const onCreate = async (values) => {
    try {
      setBusy(true);
      const payload = {
        clientId: String(id),
        barberId: String(values.barberId),
        style: values.style.trim(),
        notes: values.notes?.trim() || undefined,
        photos: [],
      };
      const res = await axios.post("/cuts", payload);
      setCuts((prev) => [res.data, ...prev]);
      formNew.reset({ barberId: "", style: "", notes: "" });
      setOpenNew(false);
      toast.success("Corte registrado");
    } catch {
      toast.error("No se pudo crear el corte");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (cutId) => {
    if (!confirm("¿Eliminar corte?")) return;
    try {
      await axios.delete(`/cuts/${cutId}`);
      setCuts((prev) => prev.filter((x) => x.id !== cutId));
      toast.success("Corte eliminado");
    } catch {
      toast.error("No se pudo eliminar el corte");
    }
  };

  const onUpdateClient = async (values) => {
    try {
      setBusy(true);
      const payload = {
        name: values.name.trim(),
        phone: values.phone?.trim() || null,
        notes: values.notes?.trim() || null,
      };
      const res = await axios.put(`/clients/${id}`, payload);
      const updated = clientSchema.parse(res.data);
      setClient(updated);
      setOpenEdit(false);
      toast.success("Cliente actualizado");
    } catch {
      toast.error("No se pudo actualizar el cliente");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Índices ---------- */
  const hayById = useMemo(() => {
    const m = new Map();
    for (const c of cuts) m.set(c.id, buildHaystack(c, barbers));
    return m;
  }, [cuts, barbers]);

  /* ---------- Filtro ---------- */
  const filtered = useMemo(() => {
    const { cleaned, barberTok, from, to, order } = parseQuery(q);

    const matchesBarber = (cut) => {
      if (!barberTok) return true;
      const tok = barberTok.toLowerCase();
      // si parece un UUID (o parte), matchea por ID parcial
      if (/[0-9a-f-]{6,}/i.test(tok)) {
        return String(cut.barberId).toLowerCase().includes(tok);
      }
      // si no, por nombre
      const b = barbers.find((x) => String(x.id) === String(cut.barberId));
      return norm(b?.name).includes(norm(barberTok));
    };

    const inDateRange = (cut) => {
      const d = toISODate(cut.date || "");
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const byText = (cut) => {
      const hay = hayById.get(cut.id) || "";
      return tokensMatchAll(hay, cleaned);
    };

    const arr = cuts.filter(
      (c) => matchesBarber(c) && inDateRange(c) && byText(c)
    );
    arr.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      const cmp = da.localeCompare(db);
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [cuts, barbers, q, hayById]);

  /* ---------- Loading / not found ---------- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4">
        <div className="bg-card p-4 border rounded-md text-muted-foreground">
          Cliente no encontrado.
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground text-xl">
          Detalle de cliente
        </h2>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filtered.length} cortes</Badge>

          {/* Editar cliente */}
          <Drawer open={openEdit} onOpenChange={setOpenEdit}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Pencil />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar cliente</DrawerTitle>
                <DrawerDescription>
                  Modificá y guardá los cambios.
                </DrawerDescription>
              </DrawerHeader>

              <Form {...formEdit}>
                <form
                  onSubmit={formEdit.handleSubmit(onUpdateClient, onInvalid)}
                  className="space-y-4 px-3 pb-4"
                >
                  <FormField
                    control={formEdit.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Nombre*</FormFieldLabel>
                        <FormControl>
                          <Input {...field} disabled={busy} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Teléfono</FormFieldLabel>
                        <FormControl>
                          <Input {...field} disabled={busy} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Notas</FormFieldLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} disabled={busy} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DrawerFooter className="px-0">
                    <Button type="submit" disabled={busy}>
                      {busy && <Loader2 className="size-4 animate-spin" />}{" "}
                      Guardar
                    </Button>
                  </DrawerFooter>
                </form>
              </Form>
            </DrawerContent>
          </Drawer>

          {/* Nuevo corte */}
          <Drawer open={openNew} onOpenChange={setOpenNew}>
            <DrawerTrigger asChild>
              <Button size="icon">
                <PlusIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Registrar corte</DrawerTitle>
                <DrawerDescription>
                  La fecha se toma como hoy.
                </DrawerDescription>
              </DrawerHeader>

              <Form {...formNew}>
                <form
                  onSubmit={formNew.handleSubmit(onCreate, onInvalid)}
                  className="space-y-4 px-3 pb-4"
                >
                  <FormField
                    control={formNew.control}
                    name="barberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Barbero*</FormFieldLabel>
                        <FormControl>
                          <Select
                            value={field.value || ""}
                            onValueChange={(v) => field.onChange(v)}
                            disabled={busy}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecciona un barbero" />
                            </SelectTrigger>
                            <SelectContent>
                              {barbers.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formNew.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Servicio*</FormFieldLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={busy}
                            placeholder="Corte + barba, etc."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formNew.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Notas</FormFieldLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} disabled={busy} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DrawerFooter className="px-0">
                    <Button type="submit" disabled={busy}>
                      {busy && <Loader2 className="size-4 animate-spin" />}{" "}
                      Guardar
                    </Button>
                  </DrawerFooter>
                </form>
              </Form>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Contenido principal (misma envoltura que las otras páginas) */}
      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="space-y-6 overflow-visible">
            {/* Card cliente */}
            <div className="bg-card p-4 border rounded-lg text-card-foreground">
              <div className="flex items-start gap-3">
                <div className="flex justify-center items-center bg-muted border rounded-full size-10">
                  <UserIcon className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{client.name}</div>
                  <div className="space-y-1 mt-1 text-sm">
                    {client.phone && (
                      <div className="text-foreground">
                        <a
                          className="text-primary hover:underline"
                          href={`tel:${client.phone}`}
                        >
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.notes && (
                      <div className="text-muted-foreground">
                        {client.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filtro único */}
            <div className="bg-card p-3 border rounded-lg text-card-foreground">
              <div className="flex items-center gap-2">
                <Input
                  placeholder='Buscar: servicio, notas, barbero, fecha, id…  Ej: "barbero:juan desde:2025-10-01 hasta:2025-10-31 orden:asc"'
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <Button
                    variant="outline"
                    className="h-9"
                    onClick={() => setQ("")}
                    title="Limpiar"
                  >
                    <Brush />
                  </Button>
                )}
              </div>
              <div className="mt-2 text-muted-foreground text-xs">
                Mostrando {filtered.length} de {cuts.length}
              </div>
            </div>

            {/* Listado cortes */}
            {filtered.length === 0 ? (
              <div className="bg-muted p-8 border rounded-md text-muted-foreground text-center">
                <div className="mb-2">No hay cortes que coincidan.</div>
                <Button onClick={() => setOpenNew(true)}>
                  <PlusIcon />
                  Nuevo
                </Button>
              </div>
            ) : (
              <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((cut) => {
                  const barberName =
                    barbers.find((b) => String(b.id) === String(cut.barberId))
                      ?.name || "—";
                  const dateStr = toISODate(cut.date || "");
                  return (
                    <div
                      key={cut.id}
                      className="flex flex-col gap-2 bg-card p-4 border rounded-lg text-card-foreground"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link
                            to={`/barbers/${cut.barberId}`}
                            className="font-semibold"
                          >
                            {barberName}
                          </Link>
                          <div className="text-muted-foreground text-xs">
                            {dateStr}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => onDelete(cut.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      {cut.style && <div className="text-sm">{cut.style}</div>}
                      {cut.notes && (
                        <div className="text-muted-foreground text-sm">
                          {cut.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ClientDetailPage;
