import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
import {
  CameraIcon,
  EyeIcon,
  ScissorsIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react";
import { formatCutDate } from "@/lib/date";

export default function BarberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [barberRes, cutsRes] = await Promise.all([
          axios.get(`/barbers/${id}`),
          axios.get(`/cuts?barberId=${id}`),
        ]);

        setBarber(barberRes.data);
        setCuts(cutsRes.data.data || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        toast.error("Error al cargar barbero o cortes");
      }
    })();
  }, [id]);

  if (!barber)
    return <p className="text-muted-foreground text-sm">Cargando...</p>;

  const handleDeleteBarber = () => {
    toast("¿Eliminar barbero?", {
      description:
        "Esta acción eliminará al barbero y sus registros asociados.",
      action: {
        label: "Eliminar",
        onClick: async () =>
          toast.promise(
            (async () => {
              await axios.delete(`/barbers/${id}`);
              navigate("/barbers");
            })(),
            {
              loading: "Eliminando barbero...",
              success: "Barbero eliminado",
              error: "Error al eliminar barbero",
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

  return (
    <section className="space-y-5 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <BackButton fallback="/barbers" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/barbers/${id}/edit`)}
          >
            <PencilIcon className="mr-1 w-4 h-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={handleDeleteBarber}>
            <Trash2Icon className="mr-1 w-4 h-4 text-destructive" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Info del barbero */}
      <div className="space-y-2 p-5 border rounded-lg">
        <h3 className="font-semibold text-base">{barber.name}</h3>
        {barber.bio && (
          <p className="text-muted-foreground text-sm">{barber.bio}</p>
        )}
        <p className="mt-2 text-sm">
          <b>Cantidad de cortes:</b> {cuts.length}
        </p>
      </div>

      {/* Lista de cortes */}
      <div className="relative flex-1 min-h-0 overflow-hidden p-4 border rounded-lg flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <ScissorsIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Cortes realizados</h4>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {cuts.length ? (
            <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {cuts.map((cut) => (
                <div
                  key={cut.id}
                  className="hover:bg-muted/50 p-3 border rounded-md text-sm transition"
                >
                  <p className="font-medium">
                    {cut.client?.name || "Sin cliente"}
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
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigate(`/history/${cut.id}`)}
                        title="Ver detalle"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteCut(cut.id)}
                        title="Eliminar corte"
                      >
                        <Trash2Icon className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
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

