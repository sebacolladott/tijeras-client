/**
 * Página: Cortes
 * - Lista, búsqueda, orden y paginación de cortes
 * - Crear, editar, eliminar y manejo de fotos (nuevas y existentes)
 */
// ---------- React ----------
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

// ---------- Formularios ----------
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ---------- Librerías ----------
import { toast } from "sonner";
import axios from "@/lib/axios";

// ---------- Utils / Hooks ----------
import { formatCutDate } from "@/lib/date";
import { useDebounce } from "@/hooks/useDebounce";

// ---------- UI Components ----------
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ComboboxCreate from "@/components/ComboboxCreate";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

// ---------- Iconos ----------
import {
  CameraIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  ArrowUpDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SearchIcon,
  DeleteIcon,
} from "lucide-react";

// ---------- Estilos ----------
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

const API = import.meta.env.VITE_API_URL;

// ---------- Schemas ----------
const cutSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
  photos: z.any().optional(), // ⚠️ no validar base64, son File reales
});

export default function Schedule() {
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
  const [limit, setLimit] = useState(10);

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

  // ---------- Datos derivados (memo) ----------
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: String(c.id), label: c.name })),
    [clients]
  );
  const barberOptions = useMemo(
    () => barbers.map((b) => ({ value: String(b.id), label: b.name })),
    [barbers]
  );

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
  /**
   * Carga/actualiza la lista de cortes según filtros y paginación.
   */
  const fetchCuts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/cuts", {
        params: {
          page,
          limit,
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
  }, [page, debouncedQuery, sortBy, order, limit]);

  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, order]);

  // ---------- Helpers ----------
  const handlePhotoUpload = (files, form) => {
    const fileArray = Array.from(files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    form.setValue("photos", fileArray, { shouldValidate: true });
  };

  const removePhoto = (index, form) => {
    const updated = [...form.getValues("photos")];
    updated.splice(index, 1);
    form.setValue("photos", updated, { shouldValidate: true });
  };

  // ---------- CRUD ----------
  const handleAddCut = async (data) => {
    const formData = new FormData();

    formData.append("clientId", data.clientId);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    for (const { file } of data.photos || []) {
      formData.append("photos", file);
    }

    await toast.promise(
      axios.post("/cuts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
      {
        loading: "Guardando corte...",
        success: "Corte creado",
        error: "Error al crear corte",
      }
    );

    addForm.reset();
    setIsAddOpen(false);
    fetchCuts();
  };

  /** Abre el drawer de edición con los datos del corte. */
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

  /** Quita una foto existente del corte (actualiza `keep`). */
  const handleRemoveOldPhoto = (photoId) => {
    const updated = editing.photos.filter((photo) => photo.id !== photoId);
    setEditing({ ...editing, photos: updated });
    editForm.setValue(
      "keep",
      updated.map((photo) => photo.id)
    );
  };

  /** Actualiza un corte existente. */
  const handleEditCut = async (data) => {
    const formData = new FormData();
    formData.append("clientId", data.clientId);
    formData.append("barberId", data.barberId);
    formData.append("style", data.style);
    if (data.notes) formData.append("notes", data.notes);

    // keep = fotos que se conservan
    const keep = editForm.getValues("keep") || [];
    for (const id of keep) formData.append("keep", id);

    // nuevas fotos
    for (const { file } of data.photos || []) {
      formData.append("photos", file);
    }

    await toast.promise(
      axios.put(`/cuts/${editing.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
      {
        loading: "Actualizando corte...",
        success: "Corte actualizado",
        error: "Error al actualizar",
      }
    );

    setIsEditOpen(false);
    fetchCuts();
  };

  /** Confirmación y eliminación de un corte. */
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

  /** Crea cliente desde el combobox y devuelve opción formateada. */
  const handleCreateClient = async (name) => {
    const res = await axios.post("/clients", { name });
    const newClient = res.data;
    setClients((prev) => [...prev, newClient]);
    return { value: String(newClient.id), label: newClient.name };
  };

  /** Crea barbero desde el combobox y devuelve opción formateada. */
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
        <h3 className="font-semibold text-lg">Agenda</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddOpen(true)}
          >
            <PlusIcon /> Agregar
          </Button>
        </div>
      </div>

      {/* 🔍 Buscador + Orden */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Buscar cortes por cliente, barbero o estilo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {loading ? "..." : `${totalCuts} resultados`}
            {query && (
              <InputGroupButton
                variant="secondary"
                onClick={() => setQuery("")}
              >
                <DeleteIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center gap-2">
          {/* Sort by */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Fecha</SelectItem>
              <SelectItem value="style">Estilo</SelectItem>
              <SelectItem value="createdAt">Creado</SelectItem>
            </SelectContent>
          </Select>

          {/* Order */}
          <Select value={order} onValueChange={setOrder}>
            <SelectTrigger>
              <SelectValue placeholder="Orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descendente</SelectItem>
              <SelectItem value="asc">Ascendente</SelectItem>
            </SelectContent>
          </Select>
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
                    {formatCutDate(cut, { dateStyle: "medium", timeStyle: "short" }) || "Sin fecha"}
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
                      onClick={() => navigate(`/schedule/${cut.id}`)}
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
        <div className="flex justify-end items-center gap-3 mt-6">
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
          >
            <SelectTrigger className="w-[180px]" size="sm">
              <SelectValue placeholder="Filas por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 por página</SelectItem>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="p-0 w-8 h-8"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ArrowLeftIcon />
          </Button>

          <span className="text-muted-foreground text-sm">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            className="p-0 w-8 h-8"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ArrowRightIcon />
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
                    items={clientOptions}
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
                    items={barberOptions}
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
              items={clientOptions}
              onCreate={handleCreateClient}
            />

            <FieldLabel>Barbero</FieldLabel>
            <ComboboxCreate
              value={editForm.watch("barberId")}
              onChange={(v) => editForm.setValue("barberId", v)}
              items={barberOptions}
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
