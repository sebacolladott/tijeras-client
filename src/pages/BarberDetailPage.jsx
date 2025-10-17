"use client";

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
  ScissorsIcon,
  Brush,
  Pencil,
  UserIcon,
  Trash2Icon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

/* ---------- util ---------- */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const toISODate = (s) => (s || "").slice(0, 10);

/* ---------- Schemas ---------- */
const barberSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().nullable().optional(),
});

const barberEditSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  bio: z.string().optional(),
});

const cutForBarberSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  style: z.string().min(1, "Servicio requerido"),
  notes: z.string().optional(),
});

/* ---------- Búsqueda unificada ---------- */
function parseQuery(q) {
  const src = norm(q);
  const mCliente = src.match(/\bcliente:([^\s]+)/)?.[1] || "";
  const mDesde = src.match(/\bdesde:(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const mHasta = src.match(/\bhasta:(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const mOrden = src.match(/\borden:(asc|desc)\b/)?.[1] || "";

  const cleaned = src
    .replace(/\bcliente:[^\s]+/g, "")
    .replace(/\bdesde:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\bhasta:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\borden:(asc|desc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    cleaned,
    clientTok: mCliente,
    from: mDesde,
    to: mHasta,
    order: mOrden || "desc",
  };
}

function buildHaystack(cut, clients) {
  const client =
    clients.find((c) => String(c.id) === String(cut.clientId)) || {};
  const clientName = client.name || "";
  const style = cut.style || "";
  const notes = cut.notes || "";
  const idText = String(cut.id || "");

  const d = cut.date ? new Date(cut.date) : null;
  const fechaCorta = d ? d.toLocaleDateString("es-AR") : "";
  const fechaLocal = d ? d.toLocaleString("es-AR") : "";
  const fechaISO = d ? d.toISOString() : "";

  return norm(
    [clientName, style, notes, idText, fechaCorta, fechaLocal, fechaISO].join(
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
function BarberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [barber, setBarber] = useState(null);
  const [cuts, setCuts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const formNew = useForm({
    resolver: zodResolver(cutForBarberSchema),
    defaultValues: { clientId: "", style: "", notes: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(barberEditSchema),
    defaultValues: { name: "", bio: "" },
  });

  const onInvalid = (errs) => {
    const first = Object.values(errs || {})[0];
    toast.error(first?.message || "Revisá los campos marcados.");
  };

  const fetchAll = async () => {
    const [bRes, cutsRes, cRes] = await Promise.all([
      axios.get(`/barbers/${id}`),
      axios.get(`/cuts`, { params: { barberId: id } }),
      axios.get(`/clients`).catch(() => ({ data: [] })),
    ]);
    const parsedBarber = barberSchema.parse(bRes.data);
    setBarber(parsedBarber);
    setCuts(Array.isArray(cutsRes.data) ? cutsRes.data : []);
    setClients(Array.isArray(cRes.data) ? cRes.data : []);

    formEdit.reset({
      name: parsedBarber.name || "",
      bio: parsedBarber.bio || "",
    });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchAll();
      } catch {
        toast.error("No se pudo cargar el barbero");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (barber) {
      formEdit.reset({ name: barber.name || "", bio: barber.bio || "" });
    }
  }, [barber]);

  /* ---------- Acciones ---------- */
  const onCreate = async (values) => {
    try {
      setBusy(true);
      const payload = {
        clientId: String(values.clientId), // UUID
        barberId: String(id), // UUID
        style: values.style.trim(),
        notes: values.notes?.trim() || undefined,
        photos: [],
      };
      const res = await axios.post("/cuts", payload);
      setCuts((prev) => [res.data, ...prev]);
      formNew.reset({ clientId: "", style: "", notes: "" });
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
      setCuts((prev) => prev.filter((c) => c.id !== cutId));
      toast.success("Corte eliminado");
    } catch {
      toast.error("No se pudo eliminar el corte");
    }
  };

  const onUpdateBarber = async (values) => {
    try {
      setBusy(true);
      const payload = {
        name: values.name.trim(),
        bio: values.bio?.trim() || null,
      };
      const res = await axios.put(`/barbers/${id}`, payload);
      const updated = barberSchema.parse(res.data);
      setBarber(updated);
      setOpenEdit(false);
      toast.success("Barbero actualizado");
    } catch {
      toast.error("No se pudo actualizar el barbero");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Índices ---------- */
  const hayById = useMemo(() => {
    const m = new Map();
    for (const c of cuts) m.set(c.id, buildHaystack(c, clients));
    return m;
  }, [cuts, clients]);

  /* ---------- Filtro ---------- */
  const filtered = useMemo(() => {
    const { cleaned, clientTok, from, to, order } = parseQuery(q);

    const matchesClient = (cut) => {
      if (!clientTok) return true;
      const tok = clientTok.toLowerCase();
      // si parece UUID (o parte), matchea por ID parcial
      if (/[0-9a-f-]{6,}/i.test(tok)) {
        return String(cut.clientId).toLowerCase().includes(tok);
      }
      // si no, por nombre
      const cl = clients.find((x) => String(x.id) === String(cut.clientId));
      return norm(cl?.name).includes(norm(clientTok));
    };

    const inDateRange = (cut) => {
      const d = toISODate(cut.date || "");
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const byText = (cut) => tokensMatchAll(hayById.get(cut.id) || "", cleaned);

    const arr = cuts.filter(
      (c) => matchesClient(c) && inDateRange(c) && byText(c)
    );
    arr.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      const cmp = da.localeCompare(db);
      return order === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [cuts, clients, q, hayById]);

  /* ---------- Loading / not found ---------- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="p-4">
        <div className="bg-card p-4 border rounded-md text-muted-foreground">
          Barbero no encontrado.
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <>
      {/* Header + Drawers */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground text-xl">
          Detalle de barbero
        </h2>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filtered.length} cortes</Badge>

          {/* Editar barbero */}
          <Drawer open={openEdit} onOpenChange={setOpenEdit}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Pencil />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar barbero</DrawerTitle>
                <DrawerDescription>
                  Modificá y guardá los cambios.
                </DrawerDescription>
              </DrawerHeader>

              <Form {...formEdit}>
                <form
                  onSubmit={formEdit.handleSubmit(onUpdateBarber, onInvalid)}
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
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Bio</FormFieldLabel>
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
              <Button>
                <PlusIcon />
                Nuevo
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
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormFieldLabel>Cliente*</FormFieldLabel>
                        <FormControl>
                          <Select
                            value={field.value || ""}
                            onValueChange={(v) => field.onChange(v)}
                            disabled={busy}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
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
                            placeholder="Corte degradado + barba"
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

      {/* Contenido principal */}
      <div className="relative flex-1 mt-6 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="space-y-6 overflow-visible">
            {/* Card barbero */}
            <div className="bg-card p-4 border rounded-lg text-card-foreground">
              <div className="flex items-start gap-3">
                <div className="flex justify-center items-center bg-muted border rounded-full size-10">
                  <ScissorsIcon className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{barber.name}</div>
                  {barber.bio && (
                    <div className="mt-1 text-muted-foreground text-sm">
                      {barber.bio}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filtro único */}
            <div className="bg-card p-3 border rounded-lg text-card-foreground">
              <div className="flex items-center gap-2">
                <Input
                  placeholder='Buscar: servicio, notas, cliente, fecha, id…  Ej: "cliente:juan desde:2025-09-01 hasta:2025-10-31 orden:asc"'
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9"
                    onClick={() => setQ("")}
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
            <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 ? (
                <div className="col-span-full bg-muted p-8 border rounded-md text-muted-foreground text-center">
                  <div className="mb-2">No hay cortes que coincidan.</div>
                  <Button onClick={() => setOpenNew(true)}>
                    <PlusIcon />
                    <Nuevo></Nuevo>
                  </Button>
                </div>
              ) : (
                filtered.map((cut) => {
                  const clientName =
                    clients.find((c) => String(c.id) === String(cut.clientId))
                      ?.name || "—";
                  const dateStr = toISODate(cut.date || "");
                  return (
                    <div
                      key={cut.id}
                      className="flex flex-col gap-2 bg-card p-4 border rounded-lg text-card-foreground"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Link to={`/clients/${cut.clientId}`}>
                            <UserIcon className="text-muted-foreground" />
                            {clientName}
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
                          <Trash2Icon />
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
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BarberDetailPage;
