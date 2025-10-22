import { useCallback, useState } from "react";
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
import { useInfiniteResource } from "@/hooks/useInfiniteResource";

const clientSchema = z.object({
  name: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const PAGE_LIMIT = 9;

export default function Clients() {
  const navigate = useNavigate();
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

  const fetchClients = useCallback(
    (pageParam, limitParam) =>
      axios
        .get("/clients", { params: { page: pageParam, limit: limitParam } })
        .then((res) => res.data),
    []
  );

  const {
    items: clients,
    total: totalClients,
    isLoading,
    hasMore,
    reset,
    sentinelRef,
  } = useInfiniteResource(fetchClients, {
    limit: PAGE_LIMIT,
    onError: () => toast.error("Error al cargar clientes"),
  });

  const onSubmitAdd = async (data) => {
    await toast.promise(
      axios.post("/clients", data).then(() => reset()),
      {
        loading: "Guardando cliente...",
        success: "Cliente creado",
        error: "Error al crear cliente",
      }
    );
    formAdd.reset();
    setIsAddOpen(false);
  };

  const onSubmitEdit = async (data) => {
    await toast.promise(
      axios.put(`/clients/${editing.id}`, data).then(() => reset()),
      {
        loading: "Guardando cambios...",
        success: "Cliente actualizado",
        error: "Error al actualizar",
      }
    );
    setIsEditOpen(false);
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
        onClick: () =>
          toast.promise(
            axios.delete(`/clients/${id}`).then(() => reset()),
            {
              loading: "Eliminando...",
              success: "Cliente eliminado",
              error: "Error al eliminar",
            }
          ),
      },
    });
  };

  const isEmpty = clients.length === 0;

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

      {isLoading && isEmpty ? (
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

      <div ref={sentinelRef} className="h-1" />
      {isLoading && !isEmpty && (
        <div className="py-4 text-muted-foreground text-sm text-center">
          Cargando más clientes...
        </div>
      )}
      {!hasMore && !isLoading && !isEmpty && (
        <div className="py-4 text-muted-foreground text-xs text-center">
          No hay más resultados.
        </div>
      )}

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
