import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";

import ProtectedLayout from "./components/ProtectedLayout";
import BarberDetail from "./pages/BarberDetail";
import Barbers from "./pages/Barbers";
import ClientDetail from "./pages/ClientDetail";
import Clients from "./pages/Clients";
import ScheduleDetail from "./pages/ScheduleDetail";
import Schedule from "./pages/Schedule";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ResetRequest from "./pages/ResetRequest";
import { toast } from "sonner";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const handleError = (event) => {
      toast.error(`Error: ${event.message}`);
      console.error(event.error);
    };

    const handleRejection = (event) => {
      toast.error(`Error: ${event.reason?.message || event.reason}`);
      console.error(event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-request" element={<ResetRequest />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/schedule" replace />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="schedule/:id" element={<ScheduleDetail />} />
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
