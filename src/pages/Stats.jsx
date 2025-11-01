"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

  useEffect(() => {
    axios
      .get("/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-40" />
        ))}
      </div>
    );

  if (!stats) return <p>Error al cargar estadísticas.</p>;

  const { totals, ranking, activity } = stats;

  return (
    <div className="space-y-6">
      {/* Totales */}
      <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
        {Object.entries(totals).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="capitalize">{key}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-3xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Cortes por barbero */}
      <Card>
        <CardHeader>
          <CardTitle>Cortes por barbero</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking.byBarber}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="barber" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalCuts" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cortes por cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes con más cortes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking.byClient}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalCuts" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Estilos más populares */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos más populares</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ranking.topStyles.map((item) => ({
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
                {ranking.topStyles.map((_, i) => (
                  <Cell key={i} fill="#0ea5e9" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actividad mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad mensual</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Barberos activos */}
      <Card>
        <CardHeader>
          <CardTitle>Barberos activos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activity.activeBarbers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="barber" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Clientes activos */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes activos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activity.activeClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
