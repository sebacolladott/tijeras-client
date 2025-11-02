import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "@/lib/axios";

import { formatCutDate } from "@/lib/date";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CameraIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  DeleteIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export default function History() {
  const navigate = useNavigate();

  const [cuts, setCuts] = useState([]);
  const [totalCuts, setTotalCuts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");
  const [limit, setLimit] = useState(10);

  const debouncedQuery = useDebounce(query, 500);

  // ---------- Fetch cortes ----------
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
  }, [page, limit, debouncedQuery, sortBy, order]);

  useEffect(() => {
    fetchCuts();
  }, [fetchCuts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sortBy, order]);

  // ---------- Eliminar corte ----------
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
          await fetchCuts();
        },
      },
    });
  };

  const isEmpty = cuts.length === 0;

  // ---------- Render ----------
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Historial de cortes</h3>
      </div>

      {/* Buscador + Orden */}
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
                <ContextMenu key={cut.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => navigate(`/history/${cut.id}`)}
                      className="hover:bg-accent/50 p-4 border rounded-lg transition cursor-pointer"
                    >
                      <h4 className="font-medium text-sm">
                        {cut.client?.name || "Sin cliente"}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {cut.barber?.name || "-"}
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {formatCutDate(cut, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }) || "Sin fecha"}
                      </p>

                      <div className="flex justify-between mt-3 text-muted-foreground text-xs">
                        <span>{cut.style || "Sin estilo"}</span>
                        <div className="flex items-center gap-1">
                          <CameraIcon className="w-3 h-3" />
                          <span>{cut.photos?.length || 0}</span>
                        </div>
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
                        navigate(`/clients/${cut.clientId}/cuts/${cut.id}/edit`)
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
