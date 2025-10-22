import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/lib/axios";
import { useUserStore } from "@/stores/userStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { ArrowLeftIcon, SendIcon } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email invalido"),
});

export default function ResetRequest() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) navigate("/cuts", { replace: true });
  }, [user, navigate]);

  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    await toast.promise(axios.post("/auth/request-reset", values), {
      loading: "Enviando correo...",
      success: () => {
        navigate("/reset", { replace: true });
        return "Se genero un token (ver consola del servidor)";
      },
      error: "Error al enviar correo",
    });
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-background to-primary/10 h-dvh">
      <div className="shadow-sm p-8 border rounded-lg w-full max-w-sm">
        <h1 className="mb-4 font-semibold text-xl text-center">
          Recuperar cuenta
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldSet>
            <FieldGroup className="space-y-2">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="usuario@email.com"
                  autoComplete="off"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button type="submit" className="w-full">
            <SendIcon />
            Enviar enlace
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link to="/login">
              <ArrowLeftIcon />
              Volver al inicio de sesion
            </Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
