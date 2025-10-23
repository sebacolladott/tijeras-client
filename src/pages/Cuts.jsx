import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import ComboboxCreate from "@/components/ComboboxCreate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  CameraIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { formatCutDate } from "@/lib/date";
import { useDebounce } from "@/hooks/useDebounce";

const API = import.meta.env.VITE_API_URL;
const PAGE_LIMIT = 9;

// ---------- Schemas ----------
const photoSchema = z.object({
  base64: z.string().min(1),
  mimeType: z.string().min(1),
});

const cutSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
  photos: z.array(photoSchema).optional(),
});

export default function Cuts() {
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [cuts, setCuts] = useState([]);
  const [totalCuts, setTotalCuts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");
  const debouncedQuery = useDebounce(query, 500);
  const navigate = useNavigate();

  // ---------- Formularios ----------
  const addForm = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
    },
  });

  const editForm = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
      keep: [],
    },
  });

  // ---------- Datos iniciales ----------
  useEffect(() => {
    (async () => {
      try {
        const [clientsRes, barbersRes] = await Promise.all([
          axios.get("/clients"),
          axios.get("/barbers"),
        ]);
        setClients(clientsRes.data.data);
        setBarbers(barbersRes.data.data);
      } catch {
        toast.error("Error al cargar datos iniciales");
      }
    })();
  }, []);

  // ---------- Fetch cortes ----------
  const fetchCuts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/cuts", {
        params: {
          page,
          limit: PAGE_LIMIT,
          q: debouncedQuery || undefined,
          sortBy,
          order,
        },
      });
      setCuts(res.data.data);
      setTotalCuts(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Error al cargar cortes");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, sortBy, order]);

  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  // ---------- Helpers ----------
  const handlePhotoUpload = (files, form) => {
    const fileArray = Array.from(files || []);
    const readers = fileArray.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) =>
            resolve({
              base64: String(event.target.result).split(",")[1],
              mimeType: file.type,
              preview: event.target.result,
            });
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((photos) => {
      const current = form.getValues("photos") || [];
      form.setValue("photos", [...current, ...photos], {
        shouldValidate: true,
      });
    });
  };

  const removePhoto = (index, form) => {
    const updated = [...form.getValues("photos")];
    updated.splice(index, 1);
    form.setValue("photos", updated, { shouldValidate: true });
  };

  // ---------- CRUD ----------
  const handleAddCut = async (data) => {
    await toast.promise(axios.post("/cuts", data), {
      loading: "Guardando corte...",
      success: "Corte creado",
      error: "Error al crear corte",
    });
    addForm.reset();
    setIsAddOpen(false);
    fetchCuts();
  };

  const openEdit = (cut) => {
    setEditing(cut);
    editForm.reset({
      clientId: cut.clientId,
      barberId: cut.barberId,
      style: cut.style,
      notes: cut.notes,
      photos: [],
      keep: cut.photos?.map((photo) => photo.id) || [],
    });
    setIsEditOpen(true);
  };

  const handleRemoveOldPhoto = (photoId) => {
    const updated = editing.photos.filter((photo) => photo.id !== photoId);
    setEditing({ ...editing, photos: updated });
    editForm.setValue(
      "keep",
      updated.map((photo) => photo.id)
    );
  };

  const handleEditCut = async (data) => {
    const keep = editForm.getValues("keep") || [];

    await toast.promise(axios.put(`/cuts/${editing.id}`, { ...data, keep }), {
      loading: "Actualizando corte...",
      success: "Corte actualizado",
      error: "Error al actualizar",
    });
    setIsEditOpen(false);
    fetchCuts();
  };

  const handleDeleteCut = (id) => {
    toast("¿Eliminar corte?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(axios.delete(`/cuts/${id}`), {
            loading: "Eliminando corte...",
            success: "Corte eliminado",
            error: "Error al eliminar",
          });
          fetchCuts();
        },
      },
    });
  };

  const handleCreateClient = async (name) => {
    const res = await axios.post("/clients", { name });
    const newClient = res.data;
    setClients((prev) => [...prev, newClient]);
    return { value: String(newClient.id), label: newClient.name };
  };

  const handleCreateBarber = async (name) => {
    const res = await axios.post("/barbers", { name });
    const newBarber = res.data;
    setBarbers((prev) => [...prev, newBarber]);
    return { value: String(newBarber.id), label: newBarber.name };
  };

  const isEmpty = cuts.length === 0;

  // ---------- Render ----------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Cortes</h3>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            Total: {totalCuts}
          </span>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusIcon /> Agregar
          </Button>
        </div>
      </div>

      {/* 🔍 Buscador + Orden */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Input
          placeholder="Buscar cortes por cliente, barbero o estilo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        {query && (
          <Button variant="ghost" onClick={() => setQuery("")}>
            Limpiar
          </Button>
        )}
        <div className="flex items-center gap-2">
          <ArrowUpDownIcon className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 border rounded-md text-sm"
          >
            <option value="date">Fecha</option>
            <option value="style">Estilo</option>
            <option value="createdAt">Creado</option>
          </select>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="px-2 py-1 border rounded-md text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          {loading && isEmpty ? (
            <div className="py-10 text-muted-foreground text-center">
              Cargando cortes...
            </div>
          ) : isEmpty ? (
            <div className="py-10 text-muted-foreground text-center">
              No hay registros todavía.
            </div>
          ) : (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {cuts.map((cut) => (
                <div key={cut.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm">
                    {cut.client?.name || "Sin cliente"}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    {cut.barber?.name || "-"}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {formatCutDate(cut) || "Sin fecha"}
                  </p>
                  <div className="flex justify-between mt-3 text-muted-foreground text-xs">
                    <span>{cut.style || "Sin estilo"}</span>
                    <div className="flex items-center gap-1">
                      <CameraIcon className="w-3 h-3" />
                      <span>{cut.photos?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => navigate(`/cuts/${cut.id}`)}
                    >
                      <EyeIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEdit(cut)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteCut(cut.id)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Paginación ---------- */}
      {!isEmpty && (
        <div className="flex justify-between items-center mt-6">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Drawer: Añadir */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo corte</DrawerTitle>
            <DrawerDescription>
              Completa los datos para registrar un nuevo corte.
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="formAddCut"
            onSubmit={addForm.handleSubmit(handleAddCut)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldGroup className="space-y-2">
                <Field data-invalid={!!addForm.formState.errors.clientId}>
                  <FieldLabel>Cliente</FieldLabel>
                  <ComboboxCreate
                    value={addForm.watch("clientId")}
                    onChange={(v) => addForm.setValue("clientId", v)}
                    items={clients.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    placeholder="Selecciona o crea..."
                    onCreate={handleCreateClient}
                  />
                  <FieldError>
                    {addForm.formState.errors.clientId?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={!!addForm.formState.errors.barberId}>
                  <FieldLabel>Barbero</FieldLabel>
                  <ComboboxCreate
                    value={addForm.watch("barberId")}
                    onChange={(v) => addForm.setValue("barberId", v)}
                    items={barbers.map((b) => ({
                      value: String(b.id),
                      label: b.name,
                    }))}
                    placeholder="Selecciona o crea..."
                    onCreate={handleCreateBarber}
                  />
                  <FieldError>
                    {addForm.formState.errors.barberId?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={!!addForm.formState.errors.style}>
                  <FieldLabel>Estilo</FieldLabel>
                  <Input
                    placeholder="Fade medio, etc."
                    {...addForm.register("style")}
                  />
                  <FieldError>
                    {addForm.formState.errors.style?.message}
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel>Notas</FieldLabel>
                  <Input
                    placeholder="Observaciones"
                    {...addForm.register("notes")}
                  />
                </Field>

                <Field>
                  <FieldLabel>Fotos</FieldLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e.target.files, addForm)}
                  />

                  {addForm.watch("photos")?.length > 0 && (
                    <PhotoProvider>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {addForm.watch("photos").map((photo, i) => (
                          <div key={i} className="group relative">
                            <PhotoView src={photo.preview}>
                              <img
                                src={photo.preview}
                                alt={`Nueva ${i + 1}`}
                                className="border rounded-md w-20 h-20 object-cover cursor-pointer"
                              />
                            </PhotoView>
                            <button
                              type="button"
                              onClick={() => removePhoto(i, addForm)}
                              className="top-1 right-1 absolute bg-black/60 p-1 rounded-full text-white"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </PhotoProvider>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formAddCut">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => addForm.reset()}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer: Editar */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar corte</DrawerTitle>
            <DrawerDescription>
              Modifica los datos o fotos de este corte existente.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="formEditCut"
            onSubmit={editForm.handleSubmit(handleEditCut)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldLabel>Cliente</FieldLabel>
            <ComboboxCreate
              value={editForm.watch("clientId")}
              onChange={(v) => editForm.setValue("clientId", v)}
              items={clients.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              onCreate={handleCreateClient}
            />

            <FieldLabel>Barbero</FieldLabel>
            <ComboboxCreate
              value={editForm.watch("barberId")}
              onChange={(v) => editForm.setValue("barberId", v)}
              items={barbers.map((b) => ({
                value: String(b.id),
                label: b.name,
              }))}
              onCreate={handleCreateBarber}
            />

            <FieldLabel>Estilo</FieldLabel>
            <Input {...editForm.register("style")} placeholder="Estilo" />

            <FieldLabel>Notas</FieldLabel>
            <Input {...editForm.register("notes")} placeholder="Notas" />

            <FieldLabel>Fotos existentes</FieldLabel>
            {editing?.photos?.length > 0 ? (
              <PhotoProvider>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editing.photos.map((photo) => {
                    const photoUrl = `${API}/cuts/${editing.id}/photos/${photo.id}/data`;
                    return (
                      <div key={photo.id} className="group relative">
                        <PhotoView src={photoUrl}>
                          <img
                            src={photoUrl}
                            alt={`Foto ${photo.id}`}
                            className="border rounded-md w-20 h-20 object-cover cursor-pointer"
                          />
                        </PhotoView>
                        <button
                          type="button"
                          onClick={() => handleRemoveOldPhoto(photo.id)}
                          className="top-1 right-1 absolute bg-black/60 p-1 rounded-full text-white"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </PhotoProvider>
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin fotos guardadas
              </p>
            )}

            <FieldLabel>Añadir fotos nuevas</FieldLabel>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoUpload(e.target.files, editForm)}
            />

            {editForm.watch("photos")?.length > 0 && (
              <PhotoProvider>
                <div className="flex flex-wrap gap-2 mt-3">
                  {editForm.watch("photos").map((photo, index) => (
                    <div key={index} className="group relative">
                      <PhotoView src={photo.preview}>
                        <img
                          src={photo.preview}
                          alt={`Nueva ${index + 1}`}
                          className="border rounded-md w-20 h-20 object-cover cursor-pointer"
                        />
                      </PhotoView>
                      <button
                        type="button"
                        onClick={() => removePhoto(index, editForm)}
                        className="top-1 right-1 absolute bg-black/60 p-1 rounded-full text-white"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </PhotoProvider>
            )}
          </form>
          <DrawerFooter>
            <Button type="submit" form="formEditCut">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
