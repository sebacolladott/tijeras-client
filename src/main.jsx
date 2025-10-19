// main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
  useParams,
  Outlet,
} from "react-router";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster } from "@/components/ui/sonner";

// shadcn/ui
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";

import { useUserStore } from "@/stores/userStore";
import {
  ArrowLeftIcon,
  CameraIcon,
  ChevronsUpDownIcon,
  EyeIcon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  RectangleEllipsisIcon,
  ScissorsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import ComboboxCreate from "./components/ComboboxCreate";
import { toast } from "sonner";

const API = "http://localhost:3000/api";

// ------------ Schemas ------------
const changeSchema = z.object({
  oldPassword: z.string().min(6, "Mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});

const photoSchema = z.object({
  base64: z.string().min(1),
  mimeType: z.string().min(1),
});

const cutSchema = z.object({
  clientId: z.string().min(1, "Elegí un cliente"),
  barberId: z.string().min(1, "Elegí un barbero"),
  style: z.string().min(1, "Indicá el estilo"),
  notes: z.string().optional(),
  photos: z.array(photoSchema).optional(),
});

// ------------ Axios ------------
const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Error";
    return Promise.reject(new Error(msg));
  }
);
async function api(path, options = {}) {
  const method = (options.method || "GET").toLowerCase();
  const data = options.body ?? undefined;
  return http.request({ url: path, method, data });
}

// ------------ AppSidebar ------------
function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();
  const [isChangingOpen, setIsChangingOpen] = useState(false);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const changeForm = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  const changePass = async (values) => {
    try {
      await api("/auth/change-password", { method: "POST", body: values });
      changeForm.reset();
      setIsChangingOpen(false);
      toast.success("Contraseña actualizada");
    } catch (e) {
      toast.error("Error al cambiar la contraseña");
      console.error(e.message);
    }
  };

  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    clearUser();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex flex-col gap-0.5 leading-none">
                    <div className="flex items-center gap-2">
                      <div className="flex justify-center items-center bg-sidebar-primary rounded-lg size-8">
                        <img
                          src="/tijeras.webp"
                          alt="Icono"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                      <div className="flex-1 grid text-sm text-left leading-tight">
                        <span className="font-bullettokilla font-medium truncate">
                          Tijeras
                        </span>
                        <span className="text-xs truncate">{user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              {/* Solo cambiar contraseña */}
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width)"
                align="start"
              >
                <DropdownMenuItem onClick={() => setIsChangingOpen(true)}>
                  <RectangleEllipsisIcon className="mr-2 size-4" />
                  Cambiar contraseña
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Aplicación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/barbers")}
                  >
                    <Link to="/dashboard/barbers">Barberos</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/clients")}
                  >
                    <Link to="/dashboard/clients">Clientes</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/cuts")}
                  >
                    <Link to="/dashboard/cuts">Cortes</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer con cerrar sesión */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout}>
                <LogOutIcon className="mr-2 size-4" />
                Cerrar sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Drawer cambiar contraseña */}
      <Drawer open={isChangingOpen} onOpenChange={setIsChangingOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Cambiar contraseña</DrawerTitle>
            <DrawerDescription>
              Ingresá tu contraseña actual y la nueva.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="changingForm"
            onSubmit={changeForm.handleSubmit(changePass)}
            className="space-y-6 p-4"
          >
            <FieldSet>
              <FieldLegend>Actualizar contraseña</FieldLegend>
              <FieldGroup className="flex flex-col gap-4">
                <Field data-invalid={!!changeForm.formState.errors.oldPassword}>
                  <FieldLabel htmlFor="oldPassword">
                    Contraseña actual
                  </FieldLabel>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...changeForm.register("oldPassword")}
                  />
                  <FieldError>
                    {changeForm.formState.errors.oldPassword?.message}
                  </FieldError>
                </Field>

                <Field data-invalid={!!changeForm.formState.errors.newPassword}>
                  <FieldLabel htmlFor="newPassword">
                    Nueva contraseña
                  </FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    {...changeForm.register("newPassword")}
                  />
                  <FieldError>
                    {changeForm.formState.errors.newPassword?.message}
                  </FieldError>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>

          <DrawerFooter>
            <Button type="submit" form="changingForm" className="w-full">
              Actualizar
            </Button>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsChangingOpen(false)}
              >
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ------------ App ------------
function App() {
  const { user, setUser } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await api("/auth/me");
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard/barbers" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Auth */}
        <Route
          path="/login"
          element={<Auth mode="login" user={user} checking={checking} />}
        />
        <Route
          path="/register"
          element={<Auth mode="register" user={user} checking={checking} />}
        />
        <Route
          path="/reset-request"
          element={
            <Auth mode="reset-request" user={user} checking={checking} />
          }
        />
        <Route
          path="/reset"
          element={<Auth mode="reset" user={user} checking={checking} />}
        />

        {/* Dashboard (protected) */}
        <Route
          path="/dashboard"
          element={
            <Protected user={user} checking={checking}>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="flex-1 bg-gradient-to-br from-background to-primary/10 overflow-auto text-foreground">
                  <Dashboard user={user} onLogout={() => setUser(null)} />
                </SidebarInset>
              </SidebarProvider>
            </Protected>
          }
        >
          <Route index element={<Navigate to="barbers" replace />} />
          <Route path="barbers" element={<Barbers />} />
          <Route path="barbers/:id" element={<BarberDetail />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="cuts" element={<Cuts />} />
          <Route path="cuts/:id" element={<CutDetail />} />
        </Route>

        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

// ------------ Protected ------------
function Protected({ user, checking, children }) {
  if (checking) return <p className="p-6">Verificando sesión…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ------------ Auth ------------
function Auth({ mode, user, checking }) {
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!checking && user) navigate("/dashboard/barbers", { replace: true });
  }, [user, checking, navigate]);

  const schemas = {
    login: z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Mínimo 6 caracteres"),
    }),
    register: z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Mínimo 6 caracteres"),
    }),
    "reset-request": z.object({
      email: z.string().email("Email inválido"),
    }),
    reset: z.object({
      token: z.string().min(1, "El token es obligatorio"),
      newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    }),
  };

  const form = useForm({
    resolver: zodResolver(schemas[mode]),
    defaultValues:
      mode === "reset"
        ? { token: "", newPassword: "" }
        : { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      setMessage("");

      if (mode === "reset-request") {
        await api("/auth/request-reset", {
          method: "POST",
          body: { email: values.email },
        });
        setMessage("Se generó un token (revisá la consola del servidor).");
        navigate("/reset", { replace: true });
        return;
      }

      if (mode === "reset") {
        await api("/auth/reset-password", {
          method: "POST",
          body: { token: values.token, newPassword: values.newPassword },
        });
        setMessage("Contraseña restablecida. Ahora podés iniciar sesión.");
        navigate("/login", { replace: true });
        return;
      }

      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: { email: values.email, password: values.password },
      });
      setUser(data);
      navigate("/dashboard/barbers", { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  const title =
    mode === "login"
      ? "Iniciar sesión"
      : mode === "register"
      ? "Registrarse"
      : mode === "reset-request"
      ? "Recuperar cuenta"
      : "Restablecer contraseña";

  return (
    <div className="mx-auto my-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {mode === "login" && "Accedé a tu cuenta"}
            {mode === "register" && "Creá tu cuenta"}
            {mode === "reset-request" && "Solicitá un token de recuperación"}
            {mode === "reset" && "Ingresá el token y tu nueva contraseña"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-3">
              {(mode === "login" ||
                mode === "register" ||
                mode === "reset-request") && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(mode === "login" || mode === "register") && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {mode === "reset" && (
                <>
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token</FormLabel>
                        <FormControl>
                          <Input placeholder="TOKEN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}
              {message && <p className="text-green-600 text-sm">{message}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                {mode === "login"
                  ? "Entrar"
                  : mode === "register"
                  ? "Crear cuenta"
                  : mode === "reset-request"
                  ? "Enviar enlace"
                  : "Restablecer"}
              </Button>

              {mode === "login" && (
                <>
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/register">Crear cuenta nueva</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/reset-request">Olvidé mi contraseña</Link>
                  </Button>
                </>
              )}
              {mode === "register" && (
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/login">Ya tengo cuenta</Link>
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

// ------------ Dashboard ------------
function Dashboard() {
  return (
    <>
      <div className="flex flex-col space-y-4 p-4 h-dvh">
        <SidebarTrigger />

        <Outlet />
      </div>
    </>
  );
}

// ------------ CRUD genérico (Zod + shadcn) ------------
function Crud({ title, entity }) {
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);

  const barberSchema = z.object({
    name: z.string().min(1, "Obligatorio"),
    bio: z.string().optional(),
    phone: z.string().optional(), // ignorado para barbers
    notes: z.string().optional(), // ignorado para barbers
  });

  const clientSchema = z.object({
    name: z.string().min(1, "Obligatorio"),
    phone: z.string().min(6, "Teléfono inválido").optional(),
    notes: z.string().optional(),
    bio: z.string().optional(), // ignorado para clients
  });

  const schema = entity === "barbers" ? barberSchema : clientSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", bio: "", phone: "", notes: "" },
  });

  const isBarbers = entity === "barbers";
  const isClients = entity === "clients";
  const isPeople = isBarbers || isClients;

  const fetchList = async () => {
    const data = await api(`/${entity}`);
    setList(data);
  };

  useEffect(() => {
    setEditId(null);
    form.reset({ name: "", bio: "", phone: "", notes: "" });
    fetchList();
  }, [entity]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      ...(isBarbers ? { bio: values.bio } : {}),
      ...(isClients ? { phone: values.phone, notes: values.notes } : {}),
    };
    const method = editId ? "PUT" : "POST";
    const path = editId ? `/${entity}/${editId}` : `/${entity}`;
    await api(path, { method, body: payload });
    form.reset({ name: "", bio: "", phone: "", notes: "" });
    setEditId(null);
    fetchList();
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    form.reset({
      name: item.name || "",
      bio: item.bio || "",
      phone: item.phone || "",
      notes: item.notes || "",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await api(`/${entity}/${id}`, { method: "DELETE" });
    fetchList();
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{title}</h3>
        {editId && (
          <Button
            variant="ghost"
            onClick={() => (setEditId(null), form.reset())}
          >
            Cancelar edición
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editId ? "Editar" : "Agregar"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="gap-3 grid sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isBarbers && (
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción corta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isClients && (
                <>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+54 9 ..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Input placeholder="Observaciones" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit">{editId ? "Guardar" : "Agregar"}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                {isBarbers && <TableHead>Bio</TableHead>}
                {isClients && (
                  <>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Notas</TableHead>
                  </>
                )}
                <TableHead className="w-[140px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    {isPeople ? (
                      <Link
                        className="underline"
                        to={`/dashboard/${entity}/${i.id}`}
                      >
                        {i.name}
                      </Link>
                    ) : (
                      i.name
                    )}
                  </TableCell>
                  {isBarbers && <TableCell>{i.bio}</TableCell>}
                  {isClients && (
                    <>
                      <TableCell>{i.phone}</TableCell>
                      <TableCell>{i.notes}</TableCell>
                    </>
                  )}
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(i)}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(i.id)}
                    >
                      🗑️
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!list.length && (
                <TableRow>
                  <TableCell colSpan={isClients ? 5 : isBarbers ? 4 : 3}>
                    <em>Sin registros.</em>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Requerido"),
        bio: z.string().optional(),
      })
    ),
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    (async () => setBarbers(await api("/barbers")))();
  }, []);
  const refresh = async () => setBarbers(await api("/barbers"));

  const onSubmit = async (data) => {
    await api("/barbers", { method: "POST", body: data });
    form.reset();
    await refresh();
    setIsAddOpen(false);
  };

  const handleDelete = (id) => {
    toast("¿Eliminar barbero?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(
            api(`/barbers/${id}`, { method: "DELETE" }).then(refresh),
            {
              loading: "Eliminando…",
              success: "Barbero eliminado",
              error: "Error al eliminar",
            }
          ),
      },
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Barberos</h3>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon /> Añadir
        </Button>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {barbers.map((b) => (
          <div
            key={b.id}
            className="hover:bg-muted/40 p-4 border rounded-lg transition"
          >
            <h4 className="font-medium text-sm">{b.name}</h4>
            <p className="text-muted-foreground text-xs">
              {b.bio || "Sin bio"}
            </p>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => navigate(`/dashboard/barbers/${b.id}`)}
              >
                <EyeIcon />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDelete(b.id)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo barbero</DrawerTitle>
          </DrawerHeader>
          <form
            id="formAddBarber"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-6"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...form.register("name")} placeholder="Nombre" />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bio</FieldLabel>
              <Textarea
                {...form.register("bio")}
                placeholder="Descripción corta"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formAddBarber">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ------------ Cuts ------------
function Cuts() {
  const [cuts, setCuts] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();

  const addForm = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
    },
  });

  // ---------- Datos ----------
  useEffect(() => {
    (async () => {
      const [clientList, barberList, cutList] = await Promise.all([
        api("/clients"),
        api("/barbers"),
        api("/cuts"),
      ]);
      setClients(clientList);
      setBarbers(barberList);
      setCuts(cutList);
    })();
  }, []);

  const refreshCuts = async () => {
    const updatedCuts = await api("/cuts");
    setCuts(updatedCuts);
  };

  // ---------- Fotos ----------
  const handlePhotoUpload = (files) => {
    const fileArray = Array.from(files || []);
    const readers = fileArray.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({
              base64: String(e.target.result).split(",")[1],
              mimeType: file.type,
              preview: e.target.result, // URL para mostrar preview
            });
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((photos) => {
      const current = addForm.getValues("photos") || [];
      addForm.setValue("photos", [...current, ...photos], {
        shouldValidate: true,
      });
    });
  };

  const removePhoto = (index) => {
    const updated = [...addForm.getValues("photos")];
    updated.splice(index, 1);
    addForm.setValue("photos", updated, { shouldValidate: true });
  };

  // ---------- Crear corte ----------
  const handleAddCut = async (data) => {
    await api("/cuts", { method: "POST", body: data });
    addForm.reset();
    await refreshCuts();
    setIsAddOpen(false);
  };

  // ---------- Crear cliente/barbero ----------
  const handleCreateClient = async (name) => {
    const newClient = await api("/clients", { method: "POST", body: { name } });
    setClients((prev) => [...prev, newClient]);
    return { value: String(newClient.id), label: newClient.name };
  };
  const handleCreateBarber = async (name) => {
    const newBarber = await api("/barbers", { method: "POST", body: { name } });
    setBarbers((prev) => [...prev, newBarber]);
    return { value: String(newBarber.id), label: newBarber.name };
  };

  // ---------- Eliminar corte ----------
  const handleDeleteCut = (id) => {
    toast("¿Eliminar corte?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(
            (async () => {
              await api(`/cuts/${id}`, { method: "DELETE" });
              await refreshCuts();
            })(),
            {
              loading: "Eliminando corte…",
              success: "Corte eliminado",
              error: "Error al eliminar corte",
            }
          );
        },
      },
    });
  };

  // ---------- Render ----------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Cortes</h3>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon /> Añadir
        </Button>
      </div>

      {/* Listado */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {cuts.map((cut) => (
          <div
            key={cut.id}
            className="hover:bg-muted/40 p-4 border rounded-lg transition-colors"
          >
            <h4 className="font-medium text-sm">
              {cut.client?.name || "Sin cliente"}
            </h4>
            <p className="text-muted-foreground text-xs">
              {cut.barber?.name || "-"}
            </p>
            <div className="flex justify-between mt-3 text-muted-foreground text-xs">
              <span>{cut.style || "Sin estilo"}</span>
              <div className="flex items-center gap-1">
                <CameraIcon className="w-3 h-3" />
                <span>{cut.photos?.length || 0}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => navigate(`/dashboard/cuts/${cut.id}`)}
              >
                <EyeIcon />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDeleteCut(cut.id)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer: Añadir */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo corte</DrawerTitle>
            <DrawerDescription>
              Completá los datos para registrar un nuevo corte.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="formAddCut"
            onSubmit={addForm.handleSubmit(handleAddCut)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldLegend>Datos del corte</FieldLegend>
              <div className="flex flex-col gap-4">
                {/* Cliente */}
                <Field data-invalid={!!addForm.formState.errors.clientId}>
                  <FieldLabel>Cliente</FieldLabel>
                  <ComboboxCreate
                    value={addForm.watch("clientId")}
                    onChange={(v) => addForm.setValue("clientId", v)}
                    items={clients.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    placeholder="Selecciona o crea…"
                    onCreate={handleCreateClient}
                  />
                  <FieldError>
                    {addForm.formState.errors.clientId?.message}
                  </FieldError>
                </Field>

                {/* Barbero */}
                <Field data-invalid={!!addForm.formState.errors.barberId}>
                  <FieldLabel>Barbero</FieldLabel>
                  <ComboboxCreate
                    value={addForm.watch("barberId")}
                    onChange={(v) => addForm.setValue("barberId", v)}
                    items={barbers.map((b) => ({
                      value: String(b.id),
                      label: b.name,
                    }))}
                    placeholder="Selecciona o crea…"
                    onCreate={handleCreateBarber}
                  />
                  <FieldError>
                    {addForm.formState.errors.barberId?.message}
                  </FieldError>
                </Field>

                {/* Estilo */}
                <Field data-invalid={!!addForm.formState.errors.style}>
                  <FieldLabel>Estilo</FieldLabel>
                  <Input
                    placeholder="Fade medio, etc."
                    {...addForm.register("style")}
                  />
                  <FieldError>
                    {addForm.formState.errors.style?.message}
                  </FieldError>
                </Field>

                {/* Notas */}
                <Field>
                  <FieldLabel>Notas</FieldLabel>
                  <Input
                    placeholder="Observaciones"
                    {...addForm.register("notes")}
                  />
                </Field>

                {/* Fotos con preview */}
                <Field>
                  <FieldLabel>Fotos</FieldLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                  <FieldDescription>
                    Podés subir varias imágenes.
                  </FieldDescription>

                  {/* Previews */}
                  {addForm.watch("photos")?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {addForm.watch("photos").map((photo, i) => (
                        <div key={i} className="group relative">
                          <img
                            src={photo.preview}
                            alt={`Foto ${i + 1}`}
                            className="border rounded-md w-20 h-20 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="top-1 right-1 absolute bg-black/60 opacity-0 group-hover:opacity-100 p-1 rounded-full text-white transition"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </FieldSet>
          </form>

          <DrawerFooter>
            <Button type="submit" form="formAddCut">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => addForm.reset()}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ------------ CutDetail ------------
function CutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const all = await api("/cuts");
      const found = all.find((x) => String(x.id) === String(id));
      setData(found || null);
    })();
  }, [id]);

  if (!data) return <p className="text-muted-foreground text-sm">Cargando…</p>;

  const delPhoto = (pid) => {
    toast("¿Eliminar foto?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(
            (async () => {
              await http.delete(`/cuts/${data.id}/photos/${pid}`);
              const refreshed = await api("/cuts");
              setData(refreshed.find((x) => x.id === data.id));
            })(),
            {
              loading: "Eliminando foto…",
              success: "Foto eliminada correctamente",
              error: "No se pudo eliminar la foto",
            }
          );
        },
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="mr-1 w-4 h-4" />
          Volver
        </Button>
      </div>

      <div className="space-y-3 p-5 border rounded-lg">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-base">
            {data.client?.id ? (
              <Link
                to={`/dashboard/clients/${data.client.id}`}
                className="hover:underline"
              >
                {data.client.name}
              </Link>
            ) : (
              data.client?.name || "Sin cliente"
            )}
          </h4>

          <p className="text-muted-foreground text-sm">
            {data.barber?.id ? (
              <Link
                to={`/dashboard/barbers/${data.barber.id}`}
                className="hover:underline"
              >
                {data.barber.name}
              </Link>
            ) : (
              data.barber?.name || "-"
            )}
          </p>
        </div>

        <div className="flex justify-between items-center mt-3 text-muted-foreground text-sm">
          <span>
            <b>Estilo:</b> {data.style || "Sin estilo"}
          </span>
          <div className="flex items-center gap-1">
            <CameraIcon className="w-4 h-4" />
            <span>{data.photos?.length || 0}</span>
          </div>
        </div>

        {data.notes && (
          <p className="mt-2 text-sm">
            <b>Notas:</b> {data.notes}
          </p>
        )}
      </div>

      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CameraIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Fotos</h4>
        </div>

        {data.photos?.length ? (
          <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {data.photos.map((p) => (
              <div key={p.id} className="group relative">
                <img
                  src={`${API}/cuts/${data.id}/photos/${p.id}/data`}
                  className="group-hover:opacity-90 border rounded-md w-full object-cover aspect-square transition cursor-pointer"
                  onClick={() =>
                    window.open(
                      `${API}/cuts/${data.id}/photos/${p.id}/data`,
                      "_blank"
                    )
                  }
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="top-1 right-1 absolute opacity-90 w-6 h-6"
                  onClick={() => delPhoto(p.id)}
                  title="Eliminar"
                >
                  <Trash2Icon className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">Sin fotos</p>
        )}
      </div>
    </section>
  );
}

// ------------ BarberDetail ------------
function BarberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      const [barbers, allCuts] = await Promise.all([
        api("/barbers"),
        api("/cuts"),
      ]);
      const b = barbers.find((x) => String(x.id) === String(id));
      setBarber(b || null);
      setCuts(
        allCuts.filter(
          (c) =>
            String(c.barberId) === String(id) ||
            String(c.barber?.id ?? "") === String(id)
        )
      );
    })();
  }, [id]);

  if (!barber)
    return <p className="text-muted-foreground text-sm">Cargando…</p>;

  const handleDeleteCut = (cutId) => {
    toast("¿Eliminar corte?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(
            api(`/cuts/${cutId}`, { method: "DELETE" }).then(() => {
              setCuts((prev) => prev.filter((x) => x.id !== cutId));
            }),
            {
              loading: "Eliminando corte…",
              success: "Corte eliminado",
              error: "Error al eliminar corte",
            }
          ),
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="mr-1 w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* Datos del barbero */}
      <div className="space-y-2 p-5 border rounded-lg">
        <h3 className="font-semibold text-base">{barber.name}</h3>
        {barber.bio && (
          <p className="text-muted-foreground text-sm">{barber.bio}</p>
        )}
        <p className="mt-2 text-sm">
          <b>Cantidad de cortes:</b> {cuts.length}
        </p>
      </div>

      {/* Cortes asociados */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <ScissorsIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Cortes realizados</h4>
        </div>

        {cuts.length ? (
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {cuts.map((c) => (
              <div
                key={c.id}
                className="hover:bg-muted/50 p-3 border rounded-md text-sm transition"
              >
                <p className="font-medium">{c.client?.name || "Sin cliente"}</p>
                <p className="text-muted-foreground text-xs">{c.style}</p>
                <div className="flex justify-between mt-2 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1">
                    <CameraIcon className="w-3 h-3" />
                    <span>{c.photos?.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/cuts/${c.id}`)}
                    >
                      <EyeIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteCut(c.id)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            Sin cortes registrados.
          </p>
        )}
      </div>
    </section>
  );
}

function Clients() {
  const [clients, setClients] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Requerido"),
        phone: z.string().optional(),
        notes: z.string().optional(),
      })
    ),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  useEffect(() => {
    (async () => setClients(await api("/clients")))();
  }, []);
  const refresh = async () => setClients(await api("/clients"));

  const onSubmit = async (data) => {
    await api("/clients", { method: "POST", body: data });
    form.reset();
    await refresh();
    setIsAddOpen(false);
  };

  const handleDelete = (id) => {
    toast("¿Eliminar cliente?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(
            api(`/clients/${id}`, { method: "DELETE" }).then(refresh),
            {
              loading: "Eliminando…",
              success: "Cliente eliminado",
              error: "Error al eliminar",
            }
          ),
      },
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Clientes</h3>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon /> Añadir
        </Button>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {clients.map((c) => (
          <div
            key={c.id}
            className="hover:bg-muted/40 p-4 border rounded-lg transition"
          >
            <h4 className="font-medium text-sm">{c.name}</h4>
            <p className="text-muted-foreground text-xs">{c.phone || "-"}</p>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => navigate(`/dashboard/clients/${c.id}`)}
              >
                <EyeIcon />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleDelete(c.id)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo cliente</DrawerTitle>
          </DrawerHeader>
          <form
            id="formAddClient"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 p-6"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...form.register("name")} placeholder="Nombre" />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input {...form.register("phone")} placeholder="+54 9 ..." />
            </Field>
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...form.register("notes")} placeholder="Observaciones" />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formAddClient">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// ------------ ClientDetail ------------
function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      const [clients, allCuts] = await Promise.all([
        api("/clients"),
        api("/cuts"),
      ]);
      const c = clients.find((x) => String(x.id) === String(id));
      setClient(c || null);
      setCuts(
        allCuts.filter(
          (x) =>
            String(x.clientId) === String(id) ||
            String(x.client?.id ?? "") === String(id)
        )
      );
    })();
  }, [id]);

  if (!client)
    return <p className="text-muted-foreground text-sm">Cargando…</p>;

  const handleDeleteCut = (cutId) => {
    toast("¿Eliminar corte?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(
            api(`/cuts/${cutId}`, { method: "DELETE" }).then(() => {
              setCuts((prev) => prev.filter((x) => x.id !== cutId));
            }),
            {
              loading: "Eliminando corte…",
              success: "Corte eliminado",
              error: "Error al eliminar corte",
            }
          ),
      },
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="mr-1 w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* Datos del cliente */}
      <div className="space-y-2 p-5 border rounded-lg">
        <h3 className="font-semibold text-base">{client.name}</h3>
        <div className="space-y-1 text-muted-foreground text-sm">
          {client.phone && (
            <p>
              <b>Teléfono:</b> {client.phone}
            </p>
          )}
          {client.notes && (
            <p>
              <b>Notas:</b> {client.notes}
            </p>
          )}
        </div>
        <p className="mt-2 text-sm">
          <b>Cantidad de cortes:</b> {cuts.length}
        </p>
      </div>

      {/* Cortes asociados */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <ScissorsIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Cortes realizados</h4>
        </div>

        {cuts.length ? (
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {cuts.map((c) => (
              <div
                key={c.id}
                className="hover:bg-muted/50 p-3 border rounded-md text-sm transition"
              >
                <p className="font-medium">{c.barber?.name || "Sin barbero"}</p>
                <p className="text-muted-foreground text-xs">{c.style}</p>
                <div className="flex justify-between mt-2 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1">
                    <CameraIcon className="w-3 h-3" />
                    <span>{c.photos?.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/cuts/${c.id}`)}
                    >
                      <EyeIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeleteCut(c.id)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            Sin cortes registrados.
          </p>
        )}
      </div>
    </section>
  );
}

// ------------ NotFound ------------
function NotFound({ user }) {
  return (
    <div className="p-6">
      <h3 className="font-semibold text-lg">404</h3>
      <p>Página no encontrada.</p>
      <div className="mt-3">
        <Button asChild>
          <Link to={user ? "/dashboard/barbers" : "/login"}>Volver</Link>
        </Button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
