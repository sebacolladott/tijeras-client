import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  DeleteIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  const formAdd = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  // ---------- Cargar clientes ----------
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/clients", {
        params: {
          page,
          limit,
          q: debouncedQuery || undefined,
          sortBy,
          order,
        },
      });
      setClients(res.data.data);
      setTotalClients(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedQuery, sortBy, order]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, order]);

  // ---------- CRUD ----------
  const onSubmitAdd = async (data) => {
    await toast.promise(axios.post("/clients", data), {
      loading: "Guardando cliente...",
      success: "Cliente creado",
      error: "Error al crear cliente",
    });
    formAdd.reset();
    setIsAddOpen(false);
    fetchClients();
  };

  const onSubmitEdit = async (data) => {
    await toast.promise(axios.put(`/clients/${editing.id}`, data), {
      loading: "Guardando cambios...",
      success: "Cliente actualizado",
      error: "Error al actualizar",
    });
    setIsEditOpen(false);
    fetchClients();
  };

  const openEdit = (client) => {
    setEditing(client);
    formEdit.reset(client);
    setIsEditOpen(true);
  };

  const handleDelete = (id) => {
    toast("¿Eliminar cliente?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(axios.delete(`/clients/${id}`), {
            loading: "Eliminando...",
            success: "Cliente eliminado",
            error: "Error al eliminar",
          });
          fetchClients();
        },
      },
    });
  };

  const isEmpty = clients.length === 0;

  // ---------- Render ----------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Clientes</h3>
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

      {/* Buscador */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Buscar clientes por nombre, telefono o notas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {loading ? "..." : `${totalClients} resultados`}
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="createdAt">Creado</SelectItem>
            </SelectContent>
          </Select>

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

      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="overflow-visible">
            {loading && isEmpty ? (
              <div className="py-10 text-muted-foreground text-center">
                Cargando clientes...
              </div>
            ) : isEmpty ? (
              <div className="py-10 text-muted-foreground text-center">
                No hay registros todavia.
              </div>
            ) : (
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
                {clients.map((client) => (
                  <div key={client.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm">{client.name}</h4>
                    <p className="text-muted-foreground text-xs">
                      {client.phone || "-"}
                    </p>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <EyeIcon />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEdit(client)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDelete(client.id)}
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

      {/* ---------- Drawer: Nuevo ---------- */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo cliente</DrawerTitle>
            <DrawerDescription>
              Ingresa los datos del nuevo cliente para registrarlo en el
              sistema.
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="formAddClient"
            onSubmit={formAdd.handleSubmit(onSubmitAdd)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formAdd.register("name")} placeholder="Nombre" />
              <FieldError>{formAdd.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Telefono</FieldLabel>
              <Input {...formAdd.register("phone")} placeholder="+54 9 ..." />
            </Field>
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...formAdd.register("notes")}
                placeholder="Observaciones"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formAddClient">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => formAdd.reset()}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ---------- Drawer: Editar ---------- */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar cliente</DrawerTitle>
            <DrawerDescription>
              Actualiza la informacion del cliente seleccionado.
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="formEditClient"
            onSubmit={formEdit.handleSubmit(onSubmitEdit)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formEdit.register("name")} placeholder="Nombre" />
              <FieldError>{formEdit.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Telefono</FieldLabel>
              <Input {...formEdit.register("phone")} placeholder="+54 9 ..." />
            </Field>
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...formEdit.register("notes")}
                placeholder="Observaciones"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formEditClient">
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
