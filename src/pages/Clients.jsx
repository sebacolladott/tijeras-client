import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const PAGE_LIMIT = 9;

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

  const formAdd = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  // ---------- Cargar clientes ----------
  const fetchClients = async (pageParam = 1) => {
    try {
      setLoading(true);
      const res = await axios.get("/clients", {
        params: { page: pageParam, limit: PAGE_LIMIT },
      });
      setClients(res.data.data);
      setTotalClients(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(page);
  }, [page]);

  // ---------- CRUD ----------
  const onSubmitAdd = async (data) => {
    await toast.promise(axios.post("/clients", data), {
      loading: "Guardando cliente...",
      success: "Cliente creado",
      error: "Error al crear cliente",
    });
    formAdd.reset();
    setIsAddOpen(false);
    fetchClients(page);
  };

  const onSubmitEdit = async (data) => {
    await toast.promise(axios.put(`/clients/${editing.id}`, data), {
      loading: "Guardando cambios...",
      success: "Cliente actualizado",
      error: "Error al actualizar",
    });
    setIsEditOpen(false);
    fetchClients(page);
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
          fetchClients(page);
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
          <span className="text-muted-foreground text-sm">
            Total: {totalClients}
          </span>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusIcon /> Agregar
          </Button>
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
                No hay registros todavía.
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
              <FieldLabel>Teléfono</FieldLabel>
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
              Actualiza la información del cliente seleccionado.
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
              <FieldLabel>Teléfono</FieldLabel>
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
