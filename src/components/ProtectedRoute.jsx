import React, { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import axios from "@/lib/axios";
import { useUserStore } from "@/stores/userStore";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";

import ManagePage from "@/pages/ManagePage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import BarbersPage from "@/pages/BarbersPage";
import BarberDetailPage from "@/pages/BarberDetailPage";

// Header simple y memoizado
const Header = React.memo(() => (
  <div className="flex justify-between items-center gap-2">
    <SidebarTrigger />
  </div>
));

function ProtectedLayout() {
  const [auth, setAuth] = useState("loading"); // ← ESTA es la forma correcta
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;

    axios
      .get("/auth/me")
      .then((res) => {
        if (!mounted) return;
        setUser(res.data);
        setAuth("ok");
      })
      .catch(() => mounted && setAuth("fail"));

    return () => {
      mounted = false;
    };
  }, [setUser]);

  if (auth === "loading") {
    return (
      <div className="flex justify-center items-center h-dvh text-muted-foreground">
        <Loader2 className="mr-2 size-6 animate-spin" />
        Cargando...
      </div>
    );
  }

  if (auth === "fail") return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col space-y-4 p-4 h-dvh">
      <Header />
      <Outlet />
    </div>
  );
}

export default function ProtectedRoute() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<ManagePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/barbers" element={<BarbersPage />} />
        <Route path="/barbers/:id" element={<BarberDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
