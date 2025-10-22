import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { ArrowLeftIcon, CameraIcon, Trash2Icon } from "lucide-react";
import { formatCutDate } from "@/lib/date";

const API = import.meta.env.VITE_API_URL;

export default function CutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/cuts");
        const all = res.data;
        const found = all.find((item) => String(item.id) === String(id));
        setData(found || null);
      } catch (err) {
        console.error("Error al cargar los cortes:", err);
      }
    })();
  }, [id]);

  if (!data)
    return <p className="text-muted-foreground text-sm">Cargando...</p>;

  const removePhoto = (photoId) => {
    toast("¿Eliminar foto?", {
      description: "Esta accion no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(
            (async () => {
              await axios.delete(`/cuts/${data.id}/photos/${photoId}`);
              const res = await axios.get("/cuts");
              const refreshed = res.data;
              setData(refreshed.find((item) => item.id === data.id));
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

  return (
    <section className="space-y-5">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="mr-1 w-4 h-4" />
          Volver
        </Button>
      </div>

      <div className="space-y-3 p-5 border rounded-lg">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-base">
            {data.client?.id ? (
              <Link to={`/clients/${data.client.id}`} className="hover:underline">
                {data.client.name}
              </Link>
            ) : (
              data.client?.name || "Sin cliente"
            )}
          </h4>

          <p className="text-muted-foreground text-sm">
            {data.barber?.id ? (
              <Link to={`/barbers/${data.barber.id}`} className="hover:underline">
                {data.barber.name}
              </Link>
            ) : (
              data.barber?.name || "-"
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
          <b>Fecha:</b> {formatCutDate(data) || "Sin fecha"}
        </p>

        {data.notes && (
          <p className="mt-2 text-sm">
            <b>Notas:</b> {data.notes}
          </p>
        )}
      </div>

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
