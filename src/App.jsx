import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";

import ProtectedLayout from "./components/ProtectedLayout";
import BarberDetail from "./pages/BarberDetail";
import Barbers from "./pages/Barbers";
import ClientDetail from "./pages/ClientDetail";
import Clients from "./pages/Clients";
import CutDetail from "./pages/CutDetail";
import Cuts from "./pages/Cuts";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ResetRequest from "./pages/ResetRequest";

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
          <Route index element={<Navigate to="/cuts" replace />} />
          <Route path="cuts" element={<Cuts />} />
          <Route path="cuts/:id" element={<CutDetail />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="barbers" element={<Barbers />} />
          <Route path="barbers/:id" element={<BarberDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
