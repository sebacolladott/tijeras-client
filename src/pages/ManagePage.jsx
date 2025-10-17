"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  PlusIcon,
  ScissorsIcon,
  UserIcon,
  Brush,
  Pencil,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel as FormFieldLabel,
  FormMessage,
} from "@/components/ui/form";
import ComboboxCreate from "@/components/ComboboxCreate";
import { toast } from "sonner";
import { Link } from "react-router";

/* ---------- Helpers de imágenes (solo creación) ---------- */
const loadImage = (blob) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(blob);
  });

async function fileToWebPDataURL(file) {
  const img = await loadImage(file);
  const scale = Math.min(1600 / img.width, 1600 / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/webp", 0.82);
  URL.revokeObjectURL(img.src);
  return dataUrl;
}

async function filesToPhotos(files) {
  const imgs = Array.from(files || [])
    .filter((f) => f.type.startsWith("image/"))
    .slice(0, 3);
  const dataUrls = await Promise.all(imgs.map(fileToWebPDataURL));
  return dataUrls.map((base64, i) => ({
    base64,
    mimeType: "image/webp",
    position: i,
  }));
}

/* ---------- Helpers de previews ---------- */
function revokePreviews(urls = []) {
  urls.forEach((u) => {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  });
}

function handleFilesChange(e, form) {
  const all = Array.from(e.target.files || []);
  const onlyImages = all.filter((f) => f.type.startsWith("image/"));
  const capped = onlyImages.slice(0, 3);

  if (all.length > 3) toast.info("Máximo 3 fotos; tomé las primeras 3.");
  if (onlyImages.length < all.length)
    toast.info("Se ignoraron archivos no-imagen.");

  const previews = capped.map((f) => URL.createObjectURL(f));
  revokePreviews(form.getValues("previews"));
  form.setValue("files", capped, { shouldValidate: true, shouldDirty: true });
  form.setValue("previews", previews, { shouldDirty: true });
}

function handleRemovePreview(idx, form) {
  const currFiles = form.getValues("files");
  const currPreviews = form.getValues("previews");
  const removed = currPreviews[idx];
  if (removed) URL.revokeObjectURL(removed);

  form.setValue(
    "files",
    currFiles.filter((_, i) => i !== idx),
    { shouldValidate: true, shouldDirty: true }
  );
  form.setValue(
    "previews",
    currPreviews.filter((_, i) => i !== idx),
    { shouldDirty: true }
  );
}

/* ---------- Schemas ---------- */
const fileSchema = z
  .instanceof(File, { message: "Archivo inválido" })
  .refine((f) => f.type?.startsWith("image/"), "Debe ser una imagen");

const cutCreateSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  barberId: z.string().min(1, "Barbero requerido"),
  style: z.string().optional(),
  notes: z.string().optional(),
  files: z.array(fileSchema).min(1, "Al menos una foto"),
  previews: z.array(z.string()).default([]),
});

const cutEditSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  barberId: z.string().min(1, "Barbero requerido"),
  style: z.string().optional(),
  notes: z.string().optional(),
});

/* ---------- Normalización & búsqueda ---------- */
const norm = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

/** Construye un texto “buscable” por corte (cliente, barbero, notas, estilo, fecha, id, fotos) */
function buildHaystack(cut, clientsById, barbersById) {
  const clientName = clientsById[String(cut.clientId)] || "";
  const barberName = barbersById[String(cut.barberId)] || "";
  const style = cut.style || "";
  const notes = cut.notes || "";
  const idText = String(cut.id || "");
  const hasPhotos = (cut.photos?.length || 0) > 0;
  const fotosText = hasPhotos ? "con fotos" : "sin fotos";

  let fechaCorta = "";
  let fechaLocal = "";
  let fechaISO = "";
  if (cut.createdAt) {
    const d = new Date(cut.createdAt);
    fechaCorta = d.toLocaleDateString("es-AR");
    fechaLocal = d.toLocaleString("es-AR");
    fechaISO = d.toISOString();
  }

  return norm(
    [
      clientName,
      barberName,
      style,
      notes,
      fechaCorta,
      fechaLocal,
      fechaISO,
      idText,
      fotosText,
    ].join(" | ")
  );
}

function matchesAllTokens(haystack, query) {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

function ManagePage() {
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crear
  const [busyForm, setBusyForm] = useState(false);
  const [openCut, setOpenCut] = useState(false);

  // Editar
  const [openEdit, setOpenEdit] = useState(false);
  const [busyEdit, setBusyEdit] = useState(false);
  const [editingCut, setEditingCut] = useState(null);

  // Único filtro
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [clientsRes, barbersRes, cutsRes] = await Promise.all([
          axios.get("/clients"),
          axios.get("/barbers"),
          axios.get("/cuts"),
        ]);
        setClients(clientsRes.data);
        setBarbers(barbersRes.data);
        setCuts(cutsRes.data);
      } catch {
        toast.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- Forms ---------- */
  const formCreate = useForm({
    resolver: zodResolver(cutCreateSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      files: [],
      previews: [],
    },
  });

  const formEdit = useForm({
    resolver: zodResolver(cutEditSchema),
    defaultValues: { clientId: "", barberId: "", style: "", notes: "" },
  });

  const onInvalid = (errs) => {
    const first = Object.values(errs || {})[0];
    const msg = first?.message || "Revisá los campos marcados.";
    toast.error(msg);
  };

  // limpiar previews al desmontar (crear)
  useEffect(() => {
    return () => revokePreviews(formCreate.getValues("previews"));
  }, []);

  // reset al cerrar el Drawer (crear)
  useEffect(() => {
    if (openCut) {
      formCreate.clearErrors();
      return;
    }
    revokePreviews(formCreate.getValues("previews"));
    formCreate.reset({
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      files: [],
      previews: [],
    });
  }, [openCut]);

  // Mappings
  const clientsById = useMemo(
    () => Object.fromEntries(clients.map((c) => [String(c.id), c.name])),
    [clients]
  );
  const barbersById = useMemo(
    () => Object.fromEntries(barbers.map((b) => [String(b.id), b.name])),
    [barbers]
  );

  // Índices haystack
  const haystacks = useMemo(() => {
    const map = new Map();
    for (const c of cuts) {
      map.set(c.id, buildHaystack(c, clientsById, barbersById));
    }
    return map;
  }, [cuts, clientsById, barbersById]);

  /* ---------- Crear inline (combobox) ---------- */
  const createClientInline = async (name) => {
    const n = name.trim();
    if (!n) return null;
    const { data } = await axios.post("/clients", { name: n });
    setClients((prev) => [data, ...prev]);
    toast.success("Cliente creado");
    return { value: String(data.id), label: data.name };
  };
  const createBarberInline = async (name) => {
    const n = name.trim();
    if (!n) return null;
    const { data } = await axios.post("/barbers", { name: n });
    setBarbers((prev) =>
      [...prev, data].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    );
    toast.success("Barbero creado");
    return { value: String(data.id), label: data.name };
  };

  /* ---------- Crear corte ---------- */
  const submitCreateCut = async (values) => {
    try {
      setBusyForm(true);
      const photos = await filesToPhotos(values.files);
      await axios.post("/cuts", {
        clientId: values.clientId,
        barberId: values.barberId,
        style: values.style?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        photos,
      });
      const { data } = await axios.get("/cuts");
      setCuts(data);
      revokePreviews(values.previews);
      formCreate.reset();
      setOpenCut(false);
      toast.success("Corte registrado");
    } catch {
      toast.error("No se pudo registrar el corte");
    } finally {
      setBusyForm(false);
    }
  };

  /* ---------- Editar corte (metadatos) ---------- */
  const openEditFor = (cut) => {
    setEditingCut(cut);
    formEdit.reset({
      clientId: String(cut.clientId || ""),
      barberId: String(cut.barberId || ""),
      style: cut.style || "",
      notes: cut.notes || "",
    });
    setOpenEdit(true);
  };

  const submitUpdateCut = async (values) => {
    if (!editingCut) return;
    try {
      setBusyEdit(true);
      const payload = {
        clientId: Number(values.clientId),
        barberId: Number(values.barberId),
        style: values.style?.trim() || null,
        notes: values.notes?.trim() || null,
      };
      const { data } = await axios.put(`/cuts/${editingCut.id}`, payload);
      // actualizar en memoria
      setCuts((prev) =>
        prev.map((c) => (c.id === editingCut.id ? { ...c, ...data } : c))
      );
      setOpenEdit(false);
      setEditingCut(null);
      toast.success("Corte actualizado");
    } catch {
      toast.error("No se pudo actualizar el corte");
    } finally {
      setBusyEdit(false);
    }
  };

  /* ---------- Borrar ---------- */
  const handleDeleteCut = async (id) => {
    if (!confirm("¿Eliminar corte?")) return;
    try {
      await axios.delete(`/cuts/${id}`);
      setCuts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Corte eliminado");
    } catch {
      toast.error("No se pudo eliminar el corte");
    }
  };

  /* ---------- Filtro ---------- */
  const filteredCuts = useMemo(() => {
    const query = q.trim();
    if (!query) return cuts;
    return cuts.filter((c) =>
      matchesAllTokens(haystacks.get(c.id) || "", query)
    );
  }, [cuts, q, haystacks]);

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
        <h2 className="font-semibold text-foreground text-xl">Cortes</h2>

        {/* Nuevo corte */}
        <Drawer open={openCut} onOpenChange={setOpenCut}>
          <DrawerTrigger asChild>
            <Button disabled={busyForm} className="gap-2">
              <PlusIcon />
              Nuevo
            </Button>
          </DrawerTrigger>

          <DrawerContent className="px-2 max-h-[90vh] overflow-auto">
            <DrawerHeader>
              <DrawerTitle>Registrar nuevo corte</DrawerTitle>
              <DrawerDescription>Adjuntá imágenes.</DrawerDescription>
            </DrawerHeader>

            <Form {...formCreate}>
              <form
                onSubmit={formCreate.handleSubmit(submitCreateCut, onInvalid)}
                className="space-y-4 px-3 pb-4"
              >
                <FormField
                  control={formCreate.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Cliente*</FormFieldLabel>
                      <FormControl>
                        <ComboboxCreate
                          {...field}
                          items={clients.map((c) => ({
                            value: String(c.id),
                            label: c.name,
                          }))}
                          placeholder="Selecciona o crea…"
                          onCreate={createClientInline}
                          disabled={busyForm}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formCreate.control}
                  name="barberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Barbero*</FormFieldLabel>
                      <FormControl>
                        <ComboboxCreate
                          {...field}
                          items={barbers.map((b) => ({
                            value: String(b.id),
                            label: b.name,
                          }))}
                          placeholder="Selecciona o crea…"
                          onCreate={createBarberInline}
                          disabled={busyForm}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formCreate.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormFieldLabel>Estilo</FormFieldLabel>
                      <FormControl>
                        <Input {...field} disabled={busyForm} />
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
                        <Input {...field} disabled={busyForm} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={formCreate.control}
                  name="files"
                  render={() => (
                    <FormItem>
                      <FormFieldLabel>Fotos* (máx. 3)</FormFieldLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={busyForm}
                          onChange={(e) => handleFilesChange(e, formCreate)}
                        />
                      </FormControl>
                      <FormMessage />

                      {formCreate.watch("previews")?.length > 0 && (
                        <div className="mt-3">
                          <div className="gap-2 grid grid-cols-3 md:grid-cols-4">
                            {formCreate.watch("previews").map((src, i) => (
                              <div
                                key={src}
                                className="group relative border rounded overflow-hidden"
                              >
                                <img
                                  src={src}
                                  alt={`Preview ${i + 1}`}
                                  className="block w-full h-24 object-cover"
                                />
                                <button
                                  type="button"
                                  aria-label={`Eliminar foto ${i + 1}`}
                                  onClick={() =>
                                    handleRemovePreview(i, formCreate)
                                  }
                                  className="top-1 right-1 absolute bg-destructive opacity-90 hover:opacity-100 px-2 rounded h-7 text-destructive-foreground text-xs"
                                  disabled={busyForm}
                                >
                                  Quitar
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <DrawerFooter className="px-0">
                  <Button type="submit" disabled={busyForm} className="gap-2">
                    {busyForm && <Loader2 className="size-4 animate-spin" />}
                    <span>Registrar</span>
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
                  placeholder='Buscar: cliente, barbero, estilo, notas, fecha, "con fotos"/"sin fotos", id…'
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
                Mostrando {filteredCuts.length} de {cuts.length}
              </span>
            </div>

            {/* Listado */}
            <div className="space-y-3">
              {filteredCuts.length === 0 ? (
                <div className="bg-muted p-4 border rounded-md text-muted-foreground text-sm">
                  No hay cortes que coincidan con “{q}”.
                </div>
              ) : (
                <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3">
                  {filteredCuts.map((cut) => {
                    const createdISO = cut.createdAt
                      ? new Date(cut.createdAt).toISOString()
                      : "";
                    const createdLocal = cut.createdAt
                      ? new Date(cut.createdAt).toLocaleString("es-AR")
                      : "";
                    const createdShort = cut.createdAt
                      ? new Date(cut.createdAt).toLocaleDateString("es-AR")
                      : "";

                    return (
                      <div
                        key={cut.id}
                        className="flex flex-col gap-2 bg-card p-3 border rounded-lg text-card-foreground"
                      >
                        {/* Header con iconos y links */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col gap-1">
                            {/* Cliente */}
                            <div className="flex items-center gap-2">
                              <UserIcon className="size-4 text-muted-foreground" />
                              <Link
                                to={`/clients/${cut.clientId}`}
                                className="font-semibold text-foreground hover:underline"
                              >
                                {clientsById[String(cut.clientId)] ||
                                  "Cliente ?"}
                              </Link>
                            </div>

                            {/* Barbero */}
                            <div className="flex items-center gap-2 text-sm">
                              <ScissorsIcon className="size-4 text-muted-foreground" />
                              <Link
                                to={`/barbers/${cut.barberId}`}
                                className="text-muted-foreground hover:underline"
                              >
                                {barbersById[String(cut.barberId)] ||
                                  "Barbero ?"}
                              </Link>
                            </div>
                          </div>

                          {cut.createdAt && (
                            <time
                              className="text-muted-foreground text-xs"
                              dateTime={createdISO}
                              title={createdLocal}
                            >
                              {createdShort}
                            </time>
                          )}
                        </div>

                        {/* Notas / estilo */}
                        <p className="text-muted-foreground text-sm">
                          {cut.notes ? (
                            cut.notes
                          ) : cut.style ? (
                            <span className="italic">Estilo: {cut.style}</span>
                          ) : (
                            <span className="italic">Sin notas</span>
                          )}
                        </p>

                        {/* Fotos */}
                        {cut.photos?.length ? (
                          <PhotoProvider>
                            <div className="gap-2 grid grid-cols-3">
                              {cut.photos.map((p, i) => {
                                const src = `/api/cuts/${cut.id}/photos/${p.id}/data`;
                                return (
                                  <PhotoView key={p.id} src={src}>
                                    <img
                                      src={src}
                                      alt={`Foto ${i + 1}`}
                                      className="rounded w-full h-24 object-cover cursor-zoom-in"
                                    />
                                  </PhotoView>
                                );
                              })}
                            </div>
                          </PhotoProvider>
                        ) : (
                          <div className="bg-muted p-2 rounded text-muted-foreground text-xs">
                            Sin fotos
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex justify-end gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditFor(cut)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCut(cut.id)}
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
            <DrawerTitle>Editar corte</DrawerTitle>
            <DrawerDescription>
              Modificá cliente, barbero, estilo y notas. (Las fotos no se tocan
              aquí).
            </DrawerDescription>
          </DrawerHeader>

          <Form {...formEdit}>
            <form
              onSubmit={formEdit.handleSubmit(submitUpdateCut, onInvalid)}
              className="space-y-4 px-3 pb-4"
            >
              <FormField
                control={formEdit.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldLabel>Cliente*</FormFieldLabel>
                    <FormControl>
                      <ComboboxCreate
                        {...field}
                        items={clients.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        }))}
                        placeholder="Selecciona o crea…"
                        onCreate={createClientInline}
                        disabled={busyEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEdit.control}
                name="barberId"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldLabel>Barbero*</FormFieldLabel>
                    <FormControl>
                      <ComboboxCreate
                        {...field}
                        items={barbers.map((b) => ({
                          value: String(b.id),
                          label: b.name,
                        }))}
                        placeholder="Selecciona o crea…"
                        onCreate={createBarberInline}
                        disabled={busyEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEdit.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormFieldLabel>Estilo</FormFieldLabel>
                    <FormControl>
                      <Input {...field} disabled={busyEdit} />
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
                      <Input {...field} disabled={busyEdit} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0">
                <Button type="submit" disabled={busyEdit} className="gap-2">
                  {busyEdit && <Loader2 className="size-4 animate-spin" />}
                  Guardar
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default ManagePage;
