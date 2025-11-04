import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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

export default function Barbers() {
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState([]);
  const [totalBarbers, setTotalBarbers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  // ---------- Datos ----------
  const fetchBarbers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/barbers", {
        params: { page, limit, q: debouncedQuery || undefined, sortBy, order },
      });
      setBarbers(res.data.data);
      setTotalBarbers(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error("Error al cargar barberos");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, sortBy, order, limit]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, order]);

  // ---------- Eliminar ----------
  const handleDelete = (id) => {
    toast("¿Eliminar barbero?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(axios.delete(`/barbers/${id}`), {
            loading: "Eliminando...",
            success: "Barbero eliminado",
            error: "Error al eliminar",
          });
          fetchBarbers();
        },
      },
    });
  };

  const isEmpty = barbers.length === 0;

  // ---------- Render ----------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Barberos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/barbers/new")}
        >
          <PlusIcon /> Añadir
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Buscar barberos por nombre o bio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {loading ? "..." : `${totalBarbers} resultados`}
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

      {/* Lista */}
      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          {loading && isEmpty ? (
            <div className="py-10 text-muted-foreground text-center">
              Cargando barberos...
            </div>
          ) : isEmpty ? (
            <div className="py-10 text-muted-foreground text-center">
              No hay registros todavía.
            </div>
          ) : (
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {barbers.map((barber) => (
                <ContextMenu key={barber.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => navigate(`/barbers/${barber.id}`)}
                      className="hover:bg-accent/50 p-4 border rounded-lg transition cursor-pointer"
                    >
                      <h4 className="font-medium text-sm">{barber.name}</h4>
                      <p className="text-muted-foreground text-xs">
                        {barber.bio || "Sin biografía"}
                      </p>
                    </div>
                  </ContextMenuTrigger>

                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => navigate(`/barbers/${barber.id}`)}
                    >
                      <EyeIcon className="mr-2 w-4 h-4" /> Ver detalle
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => navigate(`/barbers/${barber.id}/edit`)}
                    >
                      <PencilIcon className="mr-2 w-4 h-4" /> Editar
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(barber.id)}
                    >
                      <Trash2Icon className="mr-2 w-4 h-4" /> Eliminar
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
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
    </>
  );
}
