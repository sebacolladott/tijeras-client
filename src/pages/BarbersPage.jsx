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
import { Loader2, PlusIcon, UserIcon, Brush, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

/* ---------- Schema ---------- */
const barberSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  bio: z.string().optional(),
});

/* ---------- Helpers ---------- */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

function buildHaystack(b) {
  const idText = String(b.id ?? "");
  const name = b.name ?? "";
  const bio = b.bio ?? "";
  let fechaCorta = "",
    fechaLocal = "",
    fechaISO = "";
  if (b.createdAt) {
    const d = new Date(b.createdAt);
    fechaCorta = d.toLocaleDateString("es-AR");
    fechaLocal = d.toLocaleString("es-AR");
    fechaISO = d.toISOString();
  }
  return norm(
    [idText, name, bio, fechaCorta, fechaLocal, fechaISO].join(" | ")
  );
}

function parseFlags(q) {
  const nq = norm(q);
  const wantsWithBio = /\bcon\s+bio\b/.test(nq);
  const wantsNoBio = /\bsin\s+bio\b/.test(nq);
  const cleaned = nq
    .replace(/\bcon\s+bio\b/g, "")
    .replace(/\bsin\s+bio\b/g, "")
    .trim();
  return { cleaned, wantsWithBio, wantsNoBio };
}

function matchesAllTokens(haystack, query) {
  const toks = norm(query).split(/\s+/).filter(Boolean);
  return toks.every((t) => haystack.includes(t));
}

/* ---------- Página ---------- */
function BarbersPage() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");

  /* ---------- Forms ---------- */
  const formCreate = useForm({
    resolver: zodResolver(barberSchema),
    defaultValues: { name: "", bio: "" },
  });
  const formEdit = useForm({
    resolver: zodResolver(barberSchema),
    defaultValues: { name: "", bio: "" },
  });

  const onInvalid = (errs) => {
    const first = Object.values(errs || {})[0];
    toast.error(first?.message || "Revisá los campos marcados.");
  };

  /* ---------- Fetch inicial ---------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/barbers");
        setBarbers(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Error cargando barberos");
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
        bio: values.bio?.trim() || undefined,
      };
      const res = await axios.post("/barbers", payload);
      setBarbers((prev) =>
        [...prev, res.data].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "es", {
            sensitivity: "base",
          })
        )
      );
      formCreate.reset();
      setOpenCreate(false);
      toast.success("Barbero creado");
    } catch {
      toast.error("No se pudo crear el barbero");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Editar ---------- */
  const openEditDrawer = (b) => {
    setEditing(b);
    formEdit.reset({ name: b.name || "", bio: b.bio || "" });
    setOpenEdit(true);
  };

  const onEdit = async (values) => {
    if (!editing) return;
    try {
      setBusy(true);
      const payload = {
        name: values.name.trim(),
        bio: values.bio?.trim() || undefined,
      };
      const res = await axios.put(`/barbers/${editing.id}`, payload);
      setBarbers((prev) =>
        prev.map((b) => (b.id === editing.id ? res.data : b))
      );
      setOpenEdit(false);
      setEditing(null);
      toast.success("Barbero actualizado");
    } catch {
      toast.error("No se pudo actualizar el barbero");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Borrar ---------- */
  const onDelete = async (id) => {
    if (!confirm("¿Eliminar barbero? Esta acción no se puede deshacer."))
      return;
    try {
      await axios.delete(`/barbers/${id}`);
      setBarbers((prev) => prev.filter((b) => b.id !== id));
      toast.success("Barbero eliminado");
    } catch {
      toast.error("No se pudo eliminar el barbero");
    }
  };

  /* ---------- Índices ---------- */
  const haystacks = useMemo(() => {
    const m = new Map();
    for (const b of barbers) m.set(b.id, buildHaystack(b));
    return m;
  }, [barbers]);

  /* ---------- Filtro ---------- */
  const filtered = useMemo(() => {
    const { cleaned, wantsWithBio, wantsNoBio } = parseFlags(q);
    return [...barbers]
      .filter((b) => {
        if (wantsWithBio && !b.bio) return false;
        if (wantsNoBio && b.bio) return false;
        if (!cleaned) return true;
        return matchesAllTokens(haystacks.get(b.id) || "", cleaned);
      })
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "es", {
          sensitivity: "base",
        })
      );
  }, [barbers, q, haystacks]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <>
      {/* Header + Drawers */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground text-xl">Barberos</h2>

        {/* Nuevo barbero */}
        <Drawer open={openCreate} onOpenChange={setOpenCreate}>
          <DrawerTrigger asChild>
            <Button disabled={busy} className="gap-2">
              <PlusIcon /> Nuevo
            </Button>
          </DrawerTrigger>

          <DrawerContent className="px-2 max-h-[90vh] overflow-auto">
            <DrawerHeader>
              <DrawerTitle>Registrar nuevo barbero</DrawerTitle>
              <DrawerDescription>
                Agregá un integrante al equipo.
              </DrawerDescription>
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
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Bio / Especialidad</FormFieldLabel>
                      <FormControl>
                        <Textarea {...field} disabled={busy} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={busy} className="gap-2">
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    Guardar barbero
                  </Button>
                </DrawerFooter>
              </form>
            </Form>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Contenido principal */}
      <div className="relative flex-1 mt-6 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="space-y-6 overflow-visible">
            {/* Filtro */}
            <div className="gap-2 grid grid-cols-1 bg-card p-3 border rounded-lg text-card-foreground">
              <div className="flex items-center gap-2">
                <Input
                  placeholder='Buscar: nombre, bio, fecha, id… Ej: "con bio", "sin bio"'
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <Button
                    variant="outline"
                    onClick={() => setQ("")}
                    title="Limpiar"
                  >
                    <Brush />
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                Mostrando {filtered.length} de {barbers.length}
              </span>
            </div>

            {/* Listado */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-muted p-4 border rounded-md text-muted-foreground text-sm">
                  No hay barberos que coincidan con “{q}”.
                </div>
              ) : (
                <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((b) => {
                    const createdISO = b.createdAt
                      ? new Date(b.createdAt).toISOString()
                      : "";
                    const createdLocal = b.createdAt
                      ? new Date(b.createdAt).toLocaleString("es-AR")
                      : "";
                    const createdShort = b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString("es-AR")
                      : "";

                    return (
                      <div
                        key={b.id}
                        className="flex flex-col gap-2 bg-card p-3 border rounded-lg text-card-foreground"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-5 text-muted-foreground" />
                            <Link
                              to={`/barbers/${b.id}`}
                              className="font-semibold text-foreground hover:underline"
                            >
                              {b.name || "—"}
                            </Link>
                          </div>
                          {b.createdAt && (
                            <time
                              className="text-muted-foreground text-xs"
                              dateTime={createdISO}
                              title={createdLocal}
                            >
                              {createdShort}
                            </time>
                          )}
                        </div>

                        <p className="text-muted-foreground text-sm">
                          {b.bio ? (
                            b.bio
                          ) : (
                            <span className="italic">Sin bio</span>
                          )}
                        </p>

                        <div className="flex justify-end gap-2 mt-1">
                          <Button
                            variant="outline"
                            className="gap-2 h-8"
                            onClick={() => openEditDrawer(b)}
                          >
                            <Pencil /> Editar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => onDelete(b.id)}
                            className="h-8"
                          >
                            Borrar
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
            <DrawerTitle>Editar barbero</DrawerTitle>
            <DrawerDescription>
              Actualizá los datos del barbero.
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldLabel>Bio / Especialidad</FormFieldLabel>
                    <FormControl>
                      <Textarea {...field} disabled={busy} />
                    </FormControl>
                    <FormMessage />
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

export default BarbersPage;
