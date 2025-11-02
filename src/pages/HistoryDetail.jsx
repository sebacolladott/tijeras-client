import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  ArrowLeftIcon,
  CameraIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react";
import { formatCutDate } from "@/lib/date";

const API = import.meta.env.VITE_API_URL;

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/cuts/${id}`);
        setData(res.data);
      } catch {
        toast.error("Error al cargar el corte");
      }
    })();
  }, [id]);

  if (!data)
    return <p className="text-muted-foreground text-sm">Cargando...</p>;

  // ---------- Eliminar foto ----------
  const removePhoto = (photoId) => {
    toast("¿Eliminar foto?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(
            (async () => {
              await axios.delete(`/cuts/${data.id}/photos/${photoId}`);
              setData((prev) => ({
                ...prev,
                photos: prev.photos.filter((p) => p.id !== photoId),
              }));
            })(),
            {
              loading: "Eliminando foto...",
              success: "Foto eliminada correctamente",
              error: "No se pudo eliminar la foto",
            }
          );
        },
      },
    });
  };

  // ---------- Eliminar corte ----------
  const handleDeleteCut = () => {
    toast("¿Eliminar corte?", {
      description: "Esta acción eliminará el corte definitivamente.",
      action: {
        label: "Eliminar",
        onClick: async () =>
          toast.promise(
            (async () => {
              await axios.delete(`/cuts/${data.id}`);
              navigate("/history");
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
    <section className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="mr-1 w-4 h-4" />
          Volver
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/clients/${data.client?.id}/cuts/${data.id}/edit`)
            }
          >
            <PencilIcon className="mr-1 w-4 h-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={handleDeleteCut}>
            <Trash2Icon className="mr-1 w-4 h-4 text-destructive" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Info del corte */}
      <div className="space-y-3 p-5 border rounded-lg">
        <div>
          <h4 className="font-semibold text-base">
            {data.client ? (
              <Link
                to={`/clients/${data.client.id}`}
                className="hover:underline"
              >
                {data.client.name}
              </Link>
            ) : (
              "Sin cliente"
            )}
          </h4>
          <p className="text-muted-foreground text-sm">
            {data.barber ? (
              <Link
                to={`/barbers/${data.barber.id}`}
                className="hover:underline"
              >
                {data.barber.name}
              </Link>
            ) : (
              "-"
            )}
          </p>
        </div>

        <div className="flex justify-between items-center mt-3 text-muted-foreground text-sm">
          <span>
            <b>Estilo:</b> {data.style || "Sin estilo"}
          </span>
          <div className="flex items-center gap-1">
            <CameraIcon className="w-4 h-4" />
            <span>{data.photos?.length || 0}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          <b>Fecha y hora:</b>{" "}
          {formatCutDate(data, {
            dateStyle: "medium",
            timeStyle: "short",
          }) || "Sin fecha"}
        </p>

        {data.notes && (
          <p className="mt-2 text-sm">
            <b>Notas:</b> {data.notes}
          </p>
        )}
      </div>

      {/* Fotos */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CameraIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Fotos</h4>
        </div>

        {data.photos?.length ? (
          <PhotoProvider>
            <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {data.photos.map((photo) => {
                const url = `${API}/cuts/${data.id}/photos/${photo.id}/data`;
                return (
                  <div key={photo.id} className="group relative">
                    <PhotoView src={url}>
                      <img
                        src={url}
                        className="group-hover:opacity-90 border rounded-md w-full object-cover aspect-square transition cursor-pointer"
                        alt="Foto del corte"
                      />
                    </PhotoView>

                    <Button
                      size="icon"
                      variant="destructive"
                      className="top-1 right-1 absolute opacity-90 w-6 h-6"
                      onClick={() => removePhoto(photo.id)}
                      title="Eliminar"
                    >
                      <Trash2Icon className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </PhotoProvider>
        ) : (
          <p className="text-muted-foreground text-sm italic">Sin fotos</p>
        )}
      </div>
    </section>
  );
}
