"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "@/lib/axios";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  PlusIcon,
  Brush,
  Pencil,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

/* ---------- Schema ---------- */
const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

/* ---------- Helpers ---------- */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const digits = (s) => (s || "").replace(/\D/g, "");

/** Texto buscable para cada cliente */
function buildHaystack(c) {
  const idText = String(c.id ?? "");
  const name = c.name ?? "";
  const phone = c.phone ?? "";
  const phoneDigits = digits(phone);
  const notes = c.notes ?? "";
  let fechaCorta = "",
    fechaLocal = "",
    fechaISO = "";
  if (c.createdAt) {
    const d = new Date(c.createdAt);
    fechaCorta = d.toLocaleDateString("es-AR");
    fechaLocal = d.toLocaleString("es-AR");
    fechaISO = d.toISOString();
  }
  return norm(
    [
      idText,
      name,
      notes,
      phone,
      phoneDigits,
      fechaCorta,
      fechaLocal,
      fechaISO,
    ].join(" | ")
  );
}

function parseFlags(q) {
  const nq = norm(q);
  const wantsWithPhone = /\bcon\s+telefono\b/.test(nq);
  const wantsNoPhone = /\bsin\s+telefono\b/.test(nq);
  const cleaned = nq
    .replace(/\bcon\s+telefono\b/g, "")
    .replace(/\bsin\s+telefono\b/g, "")
    .trim();
  return { cleaned, wantsWithPhone, wantsNoPhone };
}

function matchesAllTokens(haystack, query) {
  const toks = norm(query).split(/\s+/).filter(Boolean);
  return toks.every((t) => haystack.includes(t));
}

/* ---------- Página ---------- */
function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  /* ---------- Forms ---------- */
  const formCreate = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });
  const formEdit = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const onInvalid = (errs) => {
    const first = Object.values(errs || {})[0];
    toast.error(first?.message || "Revisá los campos marcados.");
  };

  /* ---------- Fetch inicial ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/clients");
        setClients(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Error cargando clientes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- Crear ---------- */
  const onCreate = async (values) => {
    try {
      setBusy(true);
      const payload = {
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };
      const res = await axios.post("/clients", payload);
      setClients((prev) => [res.data, ...prev]);
      formCreate.reset();
      setOpenCreate(false);
      toast.success("Cliente creado");
    } catch {
      toast.error("No se pudo crear el cliente");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Editar ---------- */
  const openEditDrawer = (c) => {
    setEditing(c);
    formEdit.reset({
      name: c.name || "",
      phone: c.phone || "",
      notes: c.notes || "",
    });
    setOpenEdit(true);
  };

  const onEdit = async (values) => {
    if (!editing) return;
    try {
      setBusy(true);
      const payload = {
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };
      const res = await axios.put(`/clients/${editing.id}`, payload);
      setClients((prev) =>
        prev.map((c) => (c.id === editing.id ? res.data : c))
      );
      setOpenEdit(false);
      setEditing(null);
      toast.success("Cliente actualizado");
    } catch {
      toast.error("No se pudo actualizar el cliente");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Borrar ---------- */
  const onDelete = async (id) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await axios.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente eliminado");
    } catch {
      toast.error("No se pudo eliminar el cliente");
    }
  };

  /* ---------- Índices ---------- */
  const haystacks = useMemo(() => {
    const m = new Map();
    for (const c of clients) m.set(c.id, buildHaystack(c));
    return m;
  }, [clients]);

  /* ---------- Filtro ---------- */
  const filtered = useMemo(() => {
    const { cleaned, wantsWithPhone, wantsNoPhone } = parseFlags(q);
    return [...clients]
      .filter((c) => {
        if (wantsWithPhone && !c.phone) return false;
        if (wantsNoPhone && c.phone) return false;
        if (!cleaned) return true;
        return matchesAllTokens(haystacks.get(c.id) || "", cleaned);
      })
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "es", {
          sensitivity: "base",
        })
      );
  }, [clients, q, haystacks]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
        <Loader2Icon className="animate-spin" />
        <span>Cargando…</span>
      </div>
    );
  }

  return (
    <>
      {/* Header + Drawers */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground text-xl">Clientes</h2>

        {/* Nuevo cliente */}
        <Drawer open={openCreate} onOpenChange={setOpenCreate}>
          <DrawerTrigger asChild>
            <Button disabled={busy} className="gap-2">
              <PlusIcon /> Nuevo
            </Button>
          </DrawerTrigger>

          <DrawerContent className="px-2 max-h-[90vh] overflow-auto">
            <DrawerHeader>
              <DrawerTitle>Registrar nuevo cliente</DrawerTitle>
              <DrawerDescription>Agregá un cliente nuevo.</DrawerDescription>
            </DrawerHeader>

            <Form {...formCreate}>
              <form
                onSubmit={formCreate.handleSubmit(onCreate, onInvalid)}
                className="space-y-4 px-3 pb-4"
              >
                <FormField
                  control={formCreate.control}
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
                  control={formCreate.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Teléfono</FormFieldLabel>
                      <FormControl>
                        <Input {...field} disabled={busy} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formCreate.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Notas</FormFieldLabel>
                      <FormControl>
                        <Textarea {...field} disabled={busy} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={busy} className="gap-2">
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    Guardar cliente
                  </Button>
                </DrawerFooter>
              </form>
            </Form>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Contenido principal */}
      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="space-y-6 overflow-visible">
            {/* Filtro */}
            <div className="gap-2 grid grid-cols-1 bg-card p-3 border rounded-lg text-card-foreground">
              <div className="flex items-center gap-2">
                <Input
                  placeholder='Buscar: nombre, teléfono, notas, id… Ej: "con telefono", "sin telefono"'
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQ("")}
                  >
                    <Brush />
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                Mostrando {filtered.length} de {clients.length}
              </span>
            </div>

            {/* Listado */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-muted p-4 border rounded-md text-muted-foreground text-sm">
                  No hay clientes que coincidan con “{q}”.
                </div>
              ) : (
                <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((c) => {
                    const createdISO = c.createdAt
                      ? new Date(c.createdAt).toISOString()
                      : "";
                    const createdLocal = c.createdAt
                      ? new Date(c.createdAt).toLocaleString("es-AR")
                      : "";
                    const createdShort = c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString("es-AR")
                      : "";

                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-2 bg-card p-3 border rounded-lg text-card-foreground"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/clients/${c.id}`}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {c.name || "—"}
                          </Link>
                          {c.createdAt && (
                            <time
                              className="text-muted-foreground text-xs"
                              dateTime={createdISO}
                              title={createdLocal}
                            >
                              {createdShort}
                            </time>
                          )}
                        </div>

                        {c.phone && (
                          <div className="text-muted-foreground text-sm">
                            📞{" "}
                            <a
                              className="text-primary hover:underline"
                              href={`tel:${c.phone}`}
                            >
                              {c.phone}
                            </a>
                          </div>
                        )}
                        {c.notes && (
                          <div className="text-muted-foreground text-sm">
                            📝 {c.notes}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDrawer(c)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => onDelete(c.id)}
                          >
                            <TrashIcon />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer editar */}
      <Drawer open={openEdit} onOpenChange={setOpenEdit}>
        <DrawerContent className="px-2 max-h-[90vh] overflow-auto">
          <DrawerHeader>
            <DrawerTitle>Editar cliente</DrawerTitle>
            <DrawerDescription>
              Actualizá los datos del cliente.
            </DrawerDescription>
          </DrawerHeader>

          <Form {...formEdit}>
            <form
              onSubmit={formEdit.handleSubmit(onEdit, onInvalid)}
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
                      <Textarea {...field} disabled={busy} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0">
                <Button type="submit" disabled={busy} className="gap-2">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Guardar cambios
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default ClientsPage;
