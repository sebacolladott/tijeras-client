import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";

import ProtectedLayout from "./components/ProtectedLayout";

// ---------- Páginas ----------
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ResetRequest from "./pages/ResetRequest";
import Stats from "./pages/Stats";
import History from "./pages/History";
import HistoryDetail from "./pages/HistoryDetail";

import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientEdit from "./pages/ClientEdit";
import ClientCreate from "./pages/ClientCreate";
import CutCreate from "./pages/CutCreate";
import CutEdit from "./pages/CutEdit";

import Barbers from "./pages/Barbers";
import BarberDetail from "./pages/BarberDetail";
import BarberCreate from "./pages/BarberCreate";
import BarberEdit from "./pages/BarberEdit";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-request" element={<ResetRequest />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/clients" replace />} />

          {/* Estadísticas */}
          <Route path="stats" element={<Stats />} />

          {/* Historial de cortes */}
          <Route path="history" element={<History />} />
          <Route path="history/:id" element={<HistoryDetail />} />

          {/* Clientes */}
          <Route path="clients" element={<Clients />} />
          <Route path="clients/new" element={<ClientCreate />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="clients/:id/edit" element={<ClientEdit />} />
          <Route path="clients/:id/cuts/new" element={<CutCreate />} />
          <Route path="clients/:id/cuts/:cutId/edit" element={<CutEdit />} />

          {/* Barberos */}
          <Route path="barbers" element={<Barbers />} />
          <Route path="barbers/new" element={<BarberCreate />} />
          <Route path="barbers/:id" element={<BarberDetail />} />
          <Route path="barbers/:id/edit" element={<BarberEdit />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
