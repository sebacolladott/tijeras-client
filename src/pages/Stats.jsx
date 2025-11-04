"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filtros
  const [range, setRange] = useState("90d"); // 30d | 90d | 365d | all
  const [topBarbers, setTopBarbers] = useState("5");
  const [topClients, setTopClients] = useState("5");
  const [topStyles, setTopStyles] = useState("5");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/stats", { params: { range } });
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las estadísticas");
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { totals, ranking, activity } = stats || {};

  const byBarberData = [...(Array.isArray(ranking?.byBarber) ? ranking.byBarber : [])]
    .sort((a, b) => (b.totalCuts || 0) - (a.totalCuts || 0))
    .slice(0, Number(topBarbers));

  const byClientData = [...(Array.isArray(ranking?.byClient) ? ranking.byClient : [])]
    .sort((a, b) => (b.totalCuts || 0) - (a.totalCuts || 0))
    .slice(0, Number(topClients));

  const topStylesData = [...(Array.isArray(ranking?.topStyles) ? ranking.topStyles : [])]
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, Number(topStyles));

  const downloadCsv = (filename, headers, rows) => {
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          headers
            .map((h) => {
              const v = r[h] ?? "";
              const s = String(v).replaceAll('"', '""');
              return `"${s}"`;
            })
            .join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Estadísticas</h3>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Rango" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="365d">Últimos 12 meses</SelectItem>
              <SelectItem value="all">Todo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStats}>Actualizar</Button>
        </div>
      </div>

      {/* Contenido con scroll independiente */}
      <div className="relative flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          {loading ? (
            <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-40" />
              ))}
            </div>
          ) : error ? (
            <div className="space-y-4 mt-6">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchStats}>Reintentar</Button>
            </div>
          ) : !stats ? (
            <p className="mt-6">Error al cargar estadísticas.</p>
          ) : (
            <div className="space-y-6 mt-6">
              {/* Resumen */}
              <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Total de cortes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totals?.totalCuts ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total de clientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totals?.totalClients ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total de barberos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totals?.totalBarbers ?? 0}</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Top barberos */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center gap-2">
                    <CardTitle>Top barberos</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={topBarbers} onValueChange={setTopBarbers}>
                        <SelectTrigger className="w-[130px]" size="sm">
                          <SelectValue placeholder="Top" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Top 5</SelectItem>
                          <SelectItem value="10">Top 10</SelectItem>
                          <SelectItem value="20">Top 20</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadCsv(
                            "top-barberos.csv",
                            ["barber", "totalCuts"],
                            byBarberData.map((b) => ({
                              barber: b.barber,
                              totalCuts: b.totalCuts,
                            }))
                          )
                        }
                      >
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {byBarberData.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={byBarberData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="barber" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalCuts" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Top clientes */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center gap-2">
                    <CardTitle>Top clientes</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={topClients} onValueChange={setTopClients}>
                        <SelectTrigger className="w-[130px]" size="sm">
                          <SelectValue placeholder="Top" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Top 5</SelectItem>
                          <SelectItem value="10">Top 10</SelectItem>
                          <SelectItem value="20">Top 20</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadCsv(
                            "top-clientes.csv",
                            ["client", "totalCuts"],
                            byClientData.map((c) => ({
                              client: c.client,
                              totalCuts: c.totalCuts,
                            }))
                          )
                        }
                      >
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {byClientData.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={byClientData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="client" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalCuts" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Estilos más populares */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center gap-2">
                    <CardTitle>Estilos más populares</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={topStyles} onValueChange={setTopStyles}>
                        <SelectTrigger className="w-[130px]" size="sm">
                          <SelectValue placeholder="Top" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Top 5</SelectItem>
                          <SelectItem value="10">Top 10</SelectItem>
                          <SelectItem value="20">Top 20</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCsv("estilos-populares.csv", ["style", "total"], topStylesData)}
                      >
                        Exportar CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {topStylesData.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={topStylesData.map((item) => ({
                            name: item.style,
                            value: item.total,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={120}
                          fill="#0ea5e9"
                          label={({ name }) => name}
                          labelLine={false}
                          isAnimationActive={false}
                        >
                          {topStylesData.map((_, i) => (
                            <Cell key={i} fill="#0ea5e9" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Actividad mensual */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(activity?.monthlyCuts) && activity.monthlyCuts.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activity.monthlyCuts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Barberos activos */}
              <Card>
                <CardHeader>
                  <CardTitle>Barberos activos</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(activity?.activeBarbers) && activity.activeBarbers.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activity.activeBarbers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="barber" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>

              {/* Clientes activos */}
              <Card>
                <CardHeader>
                  <CardTitle>Clientes activos</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(activity?.activeClients) && activity.activeClients.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activity.activeClients}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="client" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sin datos.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

