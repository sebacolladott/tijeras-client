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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
  CameraIcon,
  EyeIcon,
  LogOutIcon,
  Pencil,
  PencilIcon,
  PlusIcon,
  RectangleEllipsisIcon,
  Trash2Icon,
} from "lucide-react";
import ComboboxCreate from "./components/ComboboxCreate";

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

  // Form hook con zod
  const changeForm = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  const changePass = async (values) => {
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: values,
      });
      changeForm.reset();
      setIsChangingOpen(false);
    } catch (e) {
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
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
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
              </SidebarMenuButton>
            </SidebarMenuItem>
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

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setIsChangingOpen(true)}>
                <RectangleEllipsisIcon />
                Cambiar contraseña
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout}>
                <LogOutIcon />
                Cerrar sesión
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Drawer para cambio de contraseña */}
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
          <Route
            path="barbers"
            element={<Crud title="Barberos" entity="barbers" />}
          />
          <Route path="barbers/:id" element={<BarberDetailRoute />} />
          <Route
            path="clients"
            element={<Crud title="Clientes" entity="clients" />}
          />
          <Route path="clients/:id" element={<ClientDetailRoute />} />
          <Route path="cuts" element={<Cuts />} />
          <Route path="cuts/:id" element={<CutDetailRoute />} />
        </Route>

        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

// ------------ Protected ------------
function Protected({ user, checking, children }) {
  if (checking) return <p className="p-6">Verificando sesión…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ------------ Auth (Zod + shadcn) ------------
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

// ------------ Cuts ------------
function Cuts() {
  const [cuts, setCuts] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCut, setSelectedCut] = useState(null);
  const navigate = useNavigate();

  // ---------------- Form crear ----------------
  const form = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
    },
  });

  // ---------------- Form editar ----------------
  const formEdit = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
    },
  });

  // ---------------- Fetch inicial ----------------
  useEffect(() => {
    (async () => {
      const [c, b, ct] = await Promise.all([
        api("/clients"),
        api("/barbers"),
        api("/cuts"),
      ]);
      setClients(c);
      setBarbers(b);
      setCuts(ct);
    })();
  }, []);

  // ---------------- Helpers ----------------
  const reload = async () => {
    const all = await api("/cuts");
    setCuts(all);
  };

  const handlePhotos = (files) => {
    const arr = Array.from(files || []);
    const readers = arr.map(
      (f) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) =>
            resolve({
              base64: String(ev.target.result).split(",")[1],
              mimeType: f.type,
            });
          reader.readAsDataURL(f);
        })
    );
    Promise.all(readers).then((photos) =>
      form.setValue("photos", photos, { shouldValidate: true })
    );
  };

  const onSubmit = async (values) => {
    await api("/cuts", { method: "POST", body: values });
    form.reset();
    reload();
    setOpenAdd(false);
  };

  const onInvalid = (err) => console.error("Errores:", err);

  // ---------------- Crear cliente/barbero inline ----------------
  const createClientInline = async (name) => {
    const newClient = await api("/clients", {
      method: "POST",
      body: { name },
    });
    setClients((prev) => [...prev, newClient]);
    return { value: String(newClient.id), label: newClient.name };
  };

  const createBarberInline = async (name) => {
    const newBarber = await api("/barbers", {
      method: "POST",
      body: { name },
    });
    setBarbers((prev) => [...prev, newBarber]);
    return { value: String(newBarber.id), label: newBarber.name };
  };

  // ---------------- Editar corte ----------------
  const openEditDrawer = (cut) => {
    setSelectedCut(cut);
    formEdit.reset({
      clientId: String(cut.clientId || ""),
      barberId: String(cut.barberId || ""),
      style: cut.style || "",
      notes: cut.notes || "",
      photos: cut.photos || [],
    });
    setOpenEdit(true);
  };

  const submitUpdateCut = async (values) => {
    if (!selectedCut) return;
    await api(`/cuts/${selectedCut.id}`, {
      method: "PUT",
      body: values,
    });
    await reload();
    setOpenEdit(false);
  };

  // ---------------- Render ----------------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Cortes</h3>
        <Button onClick={() => setOpenAdd(true)}>
          <PlusIcon />
          Añadir
        </Button>
      </div>

      <div className="relative flex-1 mt-6 overflow-hidden">
        <div className="w-full h-full overflow-auto">
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {cuts.map((c) => (
              <div
                key={c.id}
                className="hover:bg-muted/40 p-4 border rounded-lg transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="font-medium text-sm">
                    {c.client?.id ? (
                      <Link
                        to={`/dashboard/clients/${c.client.id}`}
                        className="hover:underline"
                      >
                        {c.client?.name}
                      </Link>
                    ) : (
                      c.client?.name || "Sin cliente"
                    )}
                  </h4>

                  <p className="text-muted-foreground text-xs">
                    {c.barber?.id ? (
                      <Link
                        to={`/dashboard/barbers/${c.barber.id}`}
                        className="hover:underline"
                      >
                        {c.barber?.name}
                      </Link>
                    ) : (
                      c.barber?.name || "-"
                    )}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-3 text-muted-foreground text-xs">
                  <span>{c.style || "Sin estilo"}</span>
                  <div className="flex items-center gap-1">
                    <CameraIcon className="w-3 h-3" />
                    <span>{c.photos?.length || 0}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3">
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
                    onClick={() => openEditDrawer(c)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm("¿Eliminar corte?")) return;
                      await api(`/cuts/${c.id}`, { method: "DELETE" });
                      reload();
                    }}
                  >
                    <Trash2Icon className="text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer crear */}
      <Drawer open={openAdd} onOpenChange={setOpenAdd}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo corte</DrawerTitle>
            <DrawerDescription>
              Completá los datos para registrar un nuevo corte.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="cutForm"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldLegend>Datos del corte</FieldLegend>
              <FieldGroup className="flex flex-col gap-4">
                {/* Cliente */}
                <Field data-invalid={!!form.formState.errors.clientId}>
                  <FieldLabel>Cliente</FieldLabel>
                  <ComboboxCreate
                    value={form.watch("clientId")}
                    onChange={(v) => form.setValue("clientId", v)}
                    items={clients.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    placeholder="Selecciona o crea…"
                    onCreate={createClientInline}
                  />
                  <FieldError>
                    {form.formState.errors.clientId?.message}
                  </FieldError>
                </Field>

                {/* Barbero */}
                <Field data-invalid={!!form.formState.errors.barberId}>
                  <FieldLabel>Barbero</FieldLabel>
                  <ComboboxCreate
                    value={form.watch("barberId")}
                    onChange={(v) => form.setValue("barberId", v)}
                    items={barbers.map((b) => ({
                      value: String(b.id),
                      label: b.name,
                    }))}
                    placeholder="Selecciona o crea…"
                    onCreate={createBarberInline}
                  />
                  <FieldError>
                    {form.formState.errors.barberId?.message}
                  </FieldError>
                </Field>

                {/* Estilo */}
                <Field data-invalid={!!form.formState.errors.style}>
                  <FieldLabel>Estilo</FieldLabel>
                  <Input
                    placeholder="Fade medio, etc."
                    {...form.register("style")}
                  />
                  <FieldError>
                    {form.formState.errors.style?.message}
                  </FieldError>
                </Field>

                {/* Notas */}
                <Field>
                  <FieldLabel>Notas</FieldLabel>
                  <Input
                    placeholder="Observaciones"
                    {...form.register("notes")}
                  />
                </Field>

                {/* Fotos */}
                <Field>
                  <FieldLabel>Fotos</FieldLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotos(e.target.files)}
                  />
                  <FieldDescription>
                    Podés subir varias imágenes.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>

          <DrawerFooter>
            <Button type="submit" form="cutAdDForm">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => form.reset()}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer editar */}
      <Drawer open={openEdit} onOpenChange={setOpenEdit}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar corte</DrawerTitle>
            <DrawerDescription>
              Modificá cliente, barbero, estilo y notas. (Las fotos no se tocan
              aquí)
            </DrawerDescription>
          </DrawerHeader>
          <form
            id="cutEditForm"
            onSubmit={formEdit.handleSubmit(submitUpdateCut, onInvalid)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field data-invalid={!!formEdit.formState.errors.clientId}>
              <FieldLabel>Cliente</FieldLabel>
              <ComboboxCreate
                value={formEdit.watch("clientId")}
                onChange={(v) => formEdit.setValue("clientId", v)}
                items={clients.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                placeholder="Selecciona o crea…"
                onCreate={createClientInline}
              />
              <FieldError>
                {formEdit.formState.errors.clientId?.message}
              </FieldError>
            </Field>

            <Field data-invalid={!!formEdit.formState.errors.barberId}>
              <FieldLabel>Barbero</FieldLabel>
              <ComboboxCreate
                value={formEdit.watch("barberId")}
                onChange={(v) => formEdit.setValue("barberId", v)}
                items={barbers.map((b) => ({
                  value: String(b.id),
                  label: b.name,
                }))}
                placeholder="Selecciona o crea…"
                onCreate={createBarberInline}
              />
              <FieldError>
                {formEdit.formState.errors.barberId?.message}
              </FieldError>
            </Field>

            <Field data-invalid={!!form.formState.errors.style}>
              <FieldLabel>Estilo</FieldLabel>
              <Input
                placeholder="Fade medio, etc."
                {...formEdit.register("style")}
              />
            </Field>

            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input {...formEdit.register("notes")} />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="cutEditForm">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => form.reset()}>
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
// ------------ CutDetail (route + component) ------------
function CutDetailRoute() {
  const { id } = useParams();
  return <CutDetail id={id} />;
}
function CutDetail({ id }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const all = await api("/cuts");
      const found = all.find((x) => String(x.id) === String(id));
      setData(found || null);
    })();
  }, [id]);

  if (!data) return <p>Cargando…</p>;

  const delPhoto = async (pid) => {
    if (!confirm("¿Eliminar foto?")) return;
    await http.delete(`/cuts/${data.id}/photos/${pid}`).catch(() => {});
    const refreshed = await api("/cuts");
    setData(refreshed.find((x) => x.id === data.id));
  };

  return (
    <section className="space-y-3">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← Volver
      </Button>
      <h3 className="font-semibold text-lg">
        {data.client?.id ? (
          <Link
            className="underline"
            to={`/dashboard/clients/${data.client.id}`}
          >
            {data.client?.name}
          </Link>
        ) : (
          data.client?.name
        )}{" "}
        -{" "}
        {data.barber?.id ? (
          <Link
            className="underline"
            to={`/dashboard/barbers/${data.barber.id}`}
          >
            {data.barber?.name}
          </Link>
        ) : (
          data.barber?.name
        )}
      </h3>
      <p className="text-sm">
        <b>Estilo:</b> {data.style} <br />
        <b>Notas:</b> {data.notes}
      </p>
      <div className="flex flex-wrap gap-2">
        {data.photos?.length ? (
          data.photos.map((p) => (
            <div key={p.id} className="relative">
              <img
                src={`${API}/cuts/${data.id}/photos/${p.id}/data`}
                width="200"
                className="rounded-md object-cover cursor-pointer"
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
                className="top-1 right-1 absolute w-6 h-6"
                onClick={() => delPhoto(p.id)}
                title="Eliminar"
              >
                ✕
              </Button>
            </div>
          ))
        ) : (
          <em>Sin fotos</em>
        )}
      </div>
    </section>
  );
}

// ------------ BarberDetail (route + component) ------------
function BarberDetailRoute() {
  const { id } = useParams();
  return <BarberDetail id={id} />;
}
function BarberDetail({ id }) {
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      const [barbers, allCuts] = await Promise.all([
        api("/barbers"),
        api("/cuts"),
      ]);
      setBarber(barbers.find((b) => String(b.id) === String(id)) || null);
      setCuts(
        allCuts.filter(
          (c) =>
            String(c.barberId) === String(id) ||
            String(c.barber?.id ?? "") === String(id)
        )
      );
    })();
  }, [id]);

  if (!barber) return <p>Cargando…</p>;

  return (
    <section className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← Volver
      </Button>
      <h3 className="font-semibold text-lg">{barber.name}</h3>
      {barber.bio && <p className="text-sm">{barber.bio}</p>}

      <p className="text-sm">
        <b>Cantidad de cortes:</b> {cuts.length}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Cortes de {barber.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Estilo</TableHead>
                <TableHead>Fotos</TableHead>
                <TableHead>Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.client?.id ? (
                      <Link
                        className="underline"
                        to={`/dashboard/clients/${c.client.id}`}
                      >
                        {c.client?.name}
                      </Link>
                    ) : (
                      c.client?.name || "-"
                    )}
                  </TableCell>
                  <TableCell>{c.style}</TableCell>
                  <TableCell>{c.photos?.length || 0}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/dashboard/cuts/${c.id}`}>👁️</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!cuts.length && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <em>Sin cortes registrados para este barbero.</em>
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

// ------------ ClientDetail (route + component) ------------
function ClientDetailRoute() {
  const { id } = useParams();
  return <ClientDetail id={id} />;
}
function ClientDetail({ id }) {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      const [clients, allCuts] = await Promise.all([
        api("/clients"),
        api("/cuts"),
      ]);
      setClient(clients.find((c) => String(c.id) === String(id)) || null);
      setCuts(
        allCuts.filter(
          (c) =>
            String(c.clientId) === String(id) ||
            String(c.client?.id ?? "") === String(id)
        )
      );
    })();
  }, [id]);

  if (!client) return <p>Cargando…</p>;

  return (
    <section className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← Volver
      </Button>
      <h3 className="font-semibold text-lg">{client.name}</h3>
      <p className="text-sm">
        {client.phone && (
          <>
            <b>Teléfono:</b> {client.phone}
            <br />
          </>
        )}
        {client.notes && (
          <>
            <b>Notas:</b> {client.notes}
          </>
        )}
      </p>

      <p className="text-sm">
        <b>Cantidad de cortes:</b> {cuts.length}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Cortes de {client.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barbero</TableHead>
                <TableHead>Estilo</TableHead>
                <TableHead>Fotos</TableHead>
                <TableHead>Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.barber?.id ? (
                      <Link
                        className="underline"
                        to={`/dashboard/barbers/${c.barber.id}`}
                      >
                        {c.barber?.name}
                      </Link>
                    ) : (
                      c.barber?.name || "-"
                    )}
                  </TableCell>
                  <TableCell>{c.style}</TableCell>
                  <TableCell>{c.photos?.length || 0}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/dashboard/cuts/${c.id}`}>👁️</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!cuts.length && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <em>Sin cortes registrados para este cliente.</em>
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
