import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useUserStore } from "@/stores/userStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RotateCcwIcon } from "lucide-react";

const schema = z.object({
  newPassword: z.string().min(6, "Minimo 6 caracteres"),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const token = new URLSearchParams(useLocation().search).get("token");

  useEffect(() => {
    if (user) navigate("/cuts", { replace: true });
  }, [user, navigate]);

  // ⬇️ Redirige si no hay token
  useEffect(() => {
    if (!token) navigate("/reset-request", { replace: true });
  }, [token, navigate]);

  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = (values) => {
    toast.promise(
      axios.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      }),
      {
        loading: "Restableciendo contraseña...",
        success: "Tu contraseña fue cambiada",
        error: "No se pudo restablecer la contraseña",
      }
    );
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-background to-primary/10 h-dvh">
      <div className="shadow-sm p-8 border rounded-lg w-full max-w-sm">
        <h1 className="mb-4 font-semibold text-xl text-center">
          Restablecer contraseña
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Nueva contraseña</FieldLabel>
            <Input
              type="password"
              placeholder="********"
              {...form.register("newPassword")}
            />
            <FieldError>
              {form.formState.errors.newPassword?.message}
            </FieldError>
          </Field>

          <Button type="submit" className="w-full">
            <RotateCcwIcon />
            Restablecer
          </Button>

          
        </form>
      </div>
    </div>
  );
}
