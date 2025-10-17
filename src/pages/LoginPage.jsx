import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryVerticalEndIcon } from "lucide-react";
import axios from "@/lib/axios"; // axios con withCredentials

function LoginPage() {
  const navigate = useNavigate();

  // Valores por defecto solo en desarrollo
  const [email, setEmail] = useState(
    import.meta.env.DEV ? "admin@barber.local" : ""
  );
  const [password, setPassword] = useState(import.meta.env.DEV ? "123456" : "");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Login (tu backend ya setea cookie)
      await axios.post("/auth/login", { email, password });
      // Si necesitás user info: const { data: user } = await axios.get("/auth/me");
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Credenciales inválidas o error del servidor";
      setError(msg);
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center gap-6 bg-background p-6 md:p-10 min-h-svh">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Encabezado */}
          <div className="flex flex-col items-center gap-2">
            <GalleryVerticalEndIcon className="size-6" />
            <h1 className="font-bold text-xl">Bienvenido a Dulce Ana.</h1>
          </div>

          {/* Campos */}
          <div className="gap-3 grid">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Botón */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>

          {/* Error */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
