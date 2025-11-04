import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  CameraIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  ScissorsIcon,
  Trash2Icon,
} from "lucide-react";
import { formatCutDate } from "@/lib/date";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [clientRes, cutsRes] = await Promise.all([
          axios.get(`/clients/${id}`),
          axios.get(`/cuts?clientId=${id}`),
        ]);
        setClient(clientRes.data);
        setCuts(cutsRes.data.data || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        toast.error("Error al cargar cliente o cortes");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDeleteClient = () => {
    toast("¿Eliminar cliente?", {
      description: "Esta acción eliminará al cliente y sus cortes asociados.",
      action: {
        label: "Eliminar",
        onClick: async () =>
          toast.promise(
            (async () => {
              await axios.delete(`/clients/${id}`);
              navigate("/clients");
            })(),
            {
              loading: "Eliminando cliente...",
              success: "Cliente eliminado",
              error: "Error al eliminar cliente",
            }
          ),
      },
    });
  };

  const handleDeleteCut = (cutId) => {
    toast("¿Eliminar corte?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () =>
          toast.promise(
            (async () => {
              await axios.delete(`/cuts/${cutId}`);
              setCuts((prev) => prev.filter((item) => item.id !== cutId));
            })(),
            {
              loading: "Eliminando corte...",
              success: "Corte eliminado",
              error: "Error al eliminar corte",
            }
          ),
      },
    });
  };

  if (loading)
    return <p className="text-muted-foreground text-sm">Cargando...</p>;

  if (!client)
    return (
      <p className="text-destructive text-sm">
        No se encontró el cliente solicitado.
      </p>
    );

  return (
    <section className="flex flex-col space-y-6 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <BackButton fallback="/clients" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/clients/${id}/edit`)}
          >
            <PencilIcon className="mr-1 w-4 h-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={handleDeleteClient}>
            <Trash2Icon className="mr-1 w-4 h-4" /> Eliminar
          </Button>
        </div>
      </div>

      {/* Info del cliente */}
      <div className="space-y-2 p-5 border rounded-lg">
        <h3 className="font-semibold text-base">{client.name}</h3>
        <div className="space-y-1 text-muted-foreground text-sm">
          {client.phone && (
            <p>
              <b>Teléfono:</b> {client.phone}
            </p>
          )}
          {client.notes && (
            <p>
              <b>Notas:</b> {client.notes}
            </p>
          )}
        </div>
        <p className="mt-2 text-sm">
          <b>Cantidad de cortes:</b> {cuts.length}
        </p>

        {/* Botón de nuevo corte movido a la cabecera de la lista */}
      </div>

      {/* Lista de cortes */}
      <div className="relative flex flex-col flex-1 p-4 border rounded-lg min-h-0 overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <ScissorsIcon className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Cortes realizados</h4>
          </div>
          <Button onClick={() => navigate(`/clients/${id}/cuts/new`)}>
            <PlusIcon className="mr-1 w-4 h-4" />
            Agregar
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {cuts.length > 0 ? (
            <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {cuts.map((cut) => (
                <ContextMenu key={cut.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => navigate(`/history/${cut.id}`)}
                      className="hover:bg-muted/50 p-3 border rounded-md text-sm transition cursor-pointer"
                    >
                      <p className="font-medium">
                        {cut.barber?.name || "Sin barbero"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {cut.style || "Sin estilo"}
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {formatCutDate(cut, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }) || "Sin fecha"}
                      </p>

                      <div className="flex justify-between mt-2 text-muted-foreground text-xs">
                        <div className="flex items-center gap-1">
                          <CameraIcon className="w-3 h-3" />
                          <span>{cut.photos?.length || 0}</span>
                        </div>
                        {/* acciones removidas: usar menú contextual */}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => navigate(`/history/${cut.id}`)}
                    >
                      <EyeIcon className="mr-2 w-4 h-4" /> Ver detalle
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        navigate(`/clients/${id}/cuts/${cut.id}/edit`)
                      }
                    >
                      <PencilIcon className="mr-2 w-4 h-4" /> Editar
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteCut(cut.id)}
                    >
                      <Trash2Icon className="mr-2 w-4 h-4" /> Eliminar
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              Sin cortes registrados.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
