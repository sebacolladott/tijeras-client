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
import { KeyRoundIcon, LogInIcon, MailIcon } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const form = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) =>
    toast.promise(
      axios.post("/auth/login", values).then((res) => {
        setUser(res.data);
        navigate("/", { replace: true });
      }),
      {
        loading: "Ingresando...",
        success: "Sesion iniciada",
        error: "Credenciales invalidas",
      }
    );

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-background to-primary/10 h-dvh">
      <div className="shadow-sm p-8 border rounded-lg w-full max-w-sm">
        <h1 className="mb-4 font-semibold text-xl text-center">
          Iniciar sesion
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldSet>
            <FieldGroup className="space-y-2">
              <Field>
                <FieldLabel>
                  <MailIcon className="w-4 h-4 text-primary" />
                  Email
                </FieldLabel>
                <Input
                  type="email"
                  autoComplete="off"
                  placeholder="usuario@email.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>
                  <KeyRoundIcon className="w-4 h-4 text-primary" />
                  Contraseña
                </FieldLabel>
                <Input
                  type="password"
                  placeholder="********"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <FieldError>
                    {form.formState.errors.password.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button type="submit" className="w-full">
            <LogInIcon />
            Iniciar sesion
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link to="/reset-request">
              <KeyRoundIcon />
              Olvide mi contraseña
            </Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
