import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const barberSchema = z.object({
  name: z.string().min(1, "Requerido"),
  bio: z.string().optional(),
});

const PAGE_LIMIT = 9;

export default function Barbers() {
  const navigate = useNavigate();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const formAdd = useForm({
    resolver: zodResolver(barberSchema),
    defaultValues: { name: "", bio: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(barberSchema),
    defaultValues: { name: "", bio: "" },
  });

  const fetchBarbers = useCallback(
    (pageParam, limitParam) =>
      axios
        .get("/barbers", { params: { page: pageParam, limit: limitParam } })
        .then((res) => res.data),
    []
  );

  const {
    items: barbers,
    total: totalBarbers,
    isLoading,
    hasMore,
    reset,
    sentinelRef,
  } = useInfiniteResource(fetchBarbers, {
    limit: PAGE_LIMIT,
    onError: () => toast.error("Error al cargar barberos"),
  });

  const onSubmitAdd = async (data) => {
    await toast.promise(
      axios.post("/barbers", data).then(() => reset()),
      {
        loading: "Guardando barbero...",
        success: "Barbero creado",
        error: "Error al crear barbero",
      }
    );
    formAdd.reset();
    setIsAddOpen(false);
  };

  const onSubmitEdit = async (data) => {
    await toast.promise(
      axios.put(`/barbers/${editing.id}`, data).then(() => reset()),
      {
        loading: "Guardando cambios...",
        success: "Barbero actualizado",
        error: "Error al actualizar",
      }
    );
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    toast("¿Eliminar barbero?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(
            axios.delete(`/barbers/${id}`).then(() => reset()),
            {
              loading: "Eliminando...",
              success: "Barbero eliminado",
              error: "Error al eliminar",
            }
          ),
      },
    });
  };

  const openEdit = (barber) => {
    setEditing(barber);
    formEdit.reset(barber);
    setIsEditOpen(true);
  };

  const isEmpty = barbers.length === 0;

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Barberos</h3>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            Total: {totalBarbers}
          </span>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusIcon /> Agregar
          </Button>
        </div>
      </div>

      {isLoading && isEmpty ? (
        <div className="py-10 text-muted-foreground text-center">
          Cargando barberos...
        </div>
      ) : isEmpty ? (
        <div className="py-10 text-muted-foreground text-center">
          No hay registros todavia.
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {barbers.map((barber) => (
            <div key={barber.id} className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">{barber.name}</h4>
              <p className="text-muted-foreground text-xs">
                {barber.bio || "Sin bio"}
              </p>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigate(`/barbers/${barber.id}`)}
                >
                  <EyeIcon />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openEdit(barber)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleDelete(barber.id)}
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
          Cargando mas barberos...
        </div>
      )}
      {!hasMore && !isLoading && !isEmpty && (
        <div className="py-4 text-muted-foreground text-xs text-center">
          No hay mas resultados.
        </div>
      )}

      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo barbero</DrawerTitle>
            <DrawerDescription>
              Carga los datos basicos del nuevo integrante del equipo.
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="formAddBarber"
            onSubmit={formAdd.handleSubmit(onSubmitAdd)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formAdd.register("name")} placeholder="Nombre" />
              <FieldError>{formAdd.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bio</FieldLabel>
              <Textarea
                {...formAdd.register("bio")}
                placeholder="Descripcion corta"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formAddBarber">
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
            <DrawerTitle>Editar barbero</DrawerTitle>
            <DrawerDescription>
              Modifica la informacion del barbero seleccionado.
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="formEditBarber"
            onSubmit={formEdit.handleSubmit(onSubmitEdit)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formEdit.register("name")} placeholder="Nombre" />
              <FieldError>{formEdit.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bio</FieldLabel>
              <Textarea
                {...formEdit.register("bio")}
                placeholder="Descripcion corta"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formEditBarber">
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
