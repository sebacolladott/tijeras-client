// ---------- Core ----------
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

// ---------- Router ----------
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

// ---------- Utils & Hooks ----------
import axios from "@/lib/axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";

// ---------- shadcn/ui Components ----------
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar";

// ---------- Icons ----------
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
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

// ---------- Custom Components ----------
import ComboboxCreate from "./components/ComboboxCreate";

const API = axios.defaults.baseURL;

// ------------ Schemas ------------
const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

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

// ------------ AppSidebar ------------
function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  const [isChangingOpen, setIsChangingOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  // --- Formularios ---
  const changeForm = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        role: z.enum(["USER", "ADMIN"]).default("USER"),
      })
    ),
    defaultValues: { email: "", password: "", role: "USER" },
  });

  // --- Acciones ---
  const changePass = async (values) => {
    try {
      await axios.post("/auth/change-password", values);
      changeForm.reset();
      setIsChangingOpen(false);
      toast.success("Contraseña actualizada");
    } catch {
      toast.error("Error al cambiar la contraseña");
    }
  };

  const registerUser = async (values) => {
    try {
      await toast.promise(axios.post("/auth/register", values), {
        loading: "Registrando…",
        success: "Usuario creado",
        error: "Error al registrar",
      });
      registerForm.reset();
      setIsRegisterOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    await axios.post("/auth/logout");
    clearUser();
    navigate("/login", { replace: true });
  };

  // --- Gestión de usuarios (CommandDialog) ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get("/users");
      setUsers(res.data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      await axios.delete(`/users/${id}`);
      toast.success("Usuario eliminado");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await axios.put(`/users/${user.id}`, {
        email: user.email,
        role: newRole,
      });
      toast.success("Rol actualizado");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.error("Error al cambiar rol");
    }
  };

  useEffect(() => {
    if (isUsersOpen) fetchUsers();
  }, [isUsersOpen]);

  // --- Render ---
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
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width)"
                align="start"
              >
                <DropdownMenuItem onClick={() => setIsChangingOpen(true)}>
                  <RectangleEllipsisIcon className="mr-2 size-4" />
                  Cambiar contraseña
                </DropdownMenuItem>

                {user?.role === "ADMIN" && (
                  <>
                    <DropdownMenuItem onClick={() => setIsRegisterOpen(true)}>
                      <UserPlusIcon className="mr-2 size-4" />
                      Registrar usuario
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setIsUsersOpen(true)}>
                      <UsersIcon className="mr-2 size-4" />
                      Gestionar usuarios
                    </DropdownMenuItem>
                  </>
                )}
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
                  <SidebarMenuButton asChild isActive={isActive("/cuts")}>
                    <Link to="/cuts">Cortes</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/barbers")}>
                    <Link to="/barbers">Barberos</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/clients")}>
                    <Link to="/clients">Clientes</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

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
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldLegend>Actualizar contraseña</FieldLegend>
              <FieldGroup className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="oldPassword">
                    Contraseña actual
                  </FieldLabel>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...changeForm.register("oldPassword")}
                  />
                  {changeForm.formState.errors.oldPassword && (
                    <FieldError>
                      {changeForm.formState.errors.oldPassword.message}
                    </FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="newPassword">
                    Nueva contraseña
                  </FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    {...changeForm.register("newPassword")}
                  />
                  {changeForm.formState.errors.newPassword && (
                    <FieldError>
                      {changeForm.formState.errors.newPassword.message}
                    </FieldError>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>

          <DrawerFooter>
            <Button type="submit" form="changingForm" className="w-full">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer registrar usuario */}
      <Drawer open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Registrar nuevo usuario</DrawerTitle>
            <DrawerDescription>
              Solo los administradores pueden crear nuevas cuentas.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="registerForm"
            onSubmit={registerForm.handleSubmit(registerUser)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldLegend>Datos del usuario</FieldLegend>
              <FieldGroup className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@demo.local"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <FieldError>
                      {registerForm.formState.errors.email.message}
                    </FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <FieldError>
                      {registerForm.formState.errors.password.message}
                    </FieldError>
                  )}
                </Field>

                <Field
                  orientation="horizontal"
                  className="justify-between items-center"
                >
                  <FieldLabel htmlFor="role">Administrador</FieldLabel>
                  <Switch
                    id="role"
                    checked={registerForm.watch("role") === "ADMIN"}
                    onCheckedChange={(checked) =>
                      registerForm.setValue("role", checked ? "ADMIN" : "USER")
                    }
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>

          <DrawerFooter>
            <Button type="submit" form="registerForm" className="w-full">
              Guardar
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* CommandDialog gestión de usuarios */}
      <CommandDialog open={isUsersOpen} onOpenChange={setIsUsersOpen}>
        <CommandInput placeholder="Buscar usuario por email..." />
        <CommandList>
          {loadingUsers ? (
            <CommandEmpty>Cargando…</CommandEmpty>
          ) : users.length === 0 ? (
            <CommandEmpty>Sin usuarios registrados</CommandEmpty>
          ) : (
            <>
              <CommandGroup heading="Usuarios">
                {users
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <CommandItem
                      key={u.id}
                      className="flex justify-between items-center px-2 py-1.5"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{u.email}</span>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {u.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant={u.role === "ADMIN" ? "secondary" : "outline"}
                          className="w-7 h-7"
                          title={
                            u.role === "ADMIN"
                              ? "Quitar rol de admin"
                              : "Hacer administrador"
                          }
                          onClick={() => toggleRole(u)}
                        >
                          <ShieldIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="w-7 h-7"
                          title="Eliminar usuario"
                          onClick={() => deleteUser(u.id)}
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// ------------ App ------------

function ProtectedLayout() {
  const { user, setUser } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    axios
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, [setUser]);

  if (checking) return null; // evita flash
  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex-1 bg-gradient-to-br from-background to-primary/10 overflow-auto text-foreground">
        <div className="flex flex-col space-y-4 p-4 h-dvh">
          <SidebarTrigger />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

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
      <Toaster />
    </BrowserRouter>
  );
}

// ------------ Auth ------------
function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();

  const form = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) =>
    toast.promise(
      axios.post("/auth/login", values).then((res) => {
        setUser(res.data);
        navigate("/", { replace: true });
      }),
      {
        loading: "Ingresando…",
        success: "Sesión iniciada",
        error: "Credenciales inválidas",
      }
    );

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-background to-primary/10 h-dvh">
      <div className="shadow-sm p-8 border rounded-lg w-full max-w-sm">
        <h1 className="mb-4 font-semibold text-xl text-center">
          Iniciar sesión
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldSet>
            <FieldLegend>Datos de acceso</FieldLegend>
            <FieldDescription>
              Ingresá tu correo y contraseña para acceder al panel.
            </FieldDescription>

            <FieldGroup className="flex flex-col gap-4">
              {/* Email */}
              <Field>
                <FieldLabel>Email</FieldLabel>
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

              {/* Contraseña */}
              <Field>
                <FieldLabel>Contraseña</FieldLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
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
            Entrar
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/reset-request">Olvidé mi contraseña</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}

function ResetRequest() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) navigate("/cuts", { replace: true });
  }, [user, navigate]);

  const schema = z.object({
    email: z.string().email("Email inválido"),
  });

  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    await toast.promise(axios.post("/auth/request-reset", values), {
      loading: "Enviando correo…",
      success: "Se generó un token (ver consola del servidor)",
      error: "Error al enviar correo",
    });

    navigate("/reset", { replace: true });
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-background to-primary/10 h-dvh">
      <div className="shadow-sm p-8 border rounded-lg w-full max-w-sm">
        <h1 className="mb-4 font-semibold text-xl text-center">
          Recuperar cuenta
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldSet>
            <FieldLegend>Restablecer contraseña</FieldLegend>
            <FieldDescription>
              Ingresá tu email para generar un enlace de recuperación.
            </FieldDescription>

            <FieldGroup className="flex flex-col gap-4">
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
            Enviar enlace
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Volver al inicio de sesión</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}

function ResetPassword() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) navigate("/cuts", { replace: true });
  }, [user, navigate]);

  const schema = z.object({
    token: z.string().min(1, "El token es obligatorio"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  });

  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    await toast.promise(axios.post("/auth/reset-password", values), {
      loading: "Restableciendo contraseña…",
      success: "Contraseña restablecida correctamente",
      error: "Error al restablecer contraseña",
    });

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
            <FieldLabel>Token</FieldLabel>
            <Input {...form.register("token")} placeholder="TOKEN" />
            <FieldError>{form.formState.errors.token?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Nueva contraseña</FieldLabel>
            <Input
              type="password"
              {...form.register("newPassword")}
              placeholder="••••••••"
            />
            <FieldError>
              {form.formState.errors.newPassword?.message}
            </FieldError>
          </Field>
          <Button type="submit" className="w-full">
            Restablecer
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Volver al inicio de sesión</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}

// ------------ Cuts ------------
function Cuts() {
  const [cuts, setCuts] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  // ---------- Formularios ----------
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

  const editForm = useForm({
    resolver: zodResolver(cutSchema),
    defaultValues: {
      clientId: "",
      barberId: "",
      style: "",
      notes: "",
      photos: [],
      keep: [],
    },
  });

  // ---------- Datos ----------
  useEffect(() => {
    (async () => {
      try {
        const [clientsRes, barbersRes, cutsRes] = await Promise.all([
          axios.get("/clients"),
          axios.get("/barbers"),
          axios.get("/cuts"),
        ]);

        setClients(clientsRes.data);
        setBarbers(barbersRes.data);
        setCuts(cutsRes.data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    })();
  }, []);

  const refreshCuts = async () => {
    try {
      const res = await axios.get("/cuts");
      setCuts(res.data);
    } catch (err) {
      console.error("Error al refrescar cortes:", err);
    }
  };

  // ---------- Fotos ----------
  const handlePhotoUpload = (files, form) => {
    const fileArray = Array.from(files || []);
    const readers = fileArray.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({
              base64: String(e.target.result).split(",")[1],
              mimeType: file.type,
              preview: e.target.result,
            });
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((photos) => {
      const current = form.getValues("photos") || [];
      form.setValue("photos", [...current, ...photos], {
        shouldValidate: true,
      });
    });
  };

  const removePhoto = (index, form) => {
    const updated = [...form.getValues("photos")];
    updated.splice(index, 1);
    form.setValue("photos", updated, { shouldValidate: true });
  };

  // ---------- Crear corte ----------
  const handleAddCut = async (data) => {
    await toast.promise(axios.post("/cuts", data).then(refreshCuts), {
      loading: "Guardando corte…",
      success: "Corte creado",
      error: "Error al crear corte",
    });

    addForm.reset();
    setIsAddOpen(false);
  };

  // ---------- Editar corte ----------
  const openEdit = (cut) => {
    setEditing(cut);
    editForm.reset({
      clientId: cut.clientId,
      barberId: cut.barberId,
      style: cut.style,
      notes: cut.notes,
      photos: [],
      keep: cut.photos?.map((p) => p.id) || [],
    });
    setIsEditOpen(true);
  };

  const handleRemoveOldPhoto = (pid) => {
    const updated = editing.photos.filter((x) => x.id !== pid);
    setEditing({ ...editing, photos: updated });
    const keep = updated.map((x) => x.id);
    editForm.setValue("keep", keep);
  };

  const handleEditCut = async (data) => {
    const keep = editForm.getValues("keep") || [];

    await toast.promise(
      axios
        .put(`/cuts/${editing.id}`, {
          ...data,
          keep,
        })
        .then(refreshCuts),
      {
        loading: "Actualizando corte…",
        success: "Corte actualizado",
        error: "Error al actualizar",
      }
    );

    setIsEditOpen(false);
  };

  // ---------- Crear cliente/barbero ----------
  const handleCreateClient = async (name) => {
    const res = await axios.post("/clients", { name });
    const newClient = res.data;

    setClients((prev) => [...prev, newClient]);
    return { value: String(newClient.id), label: newClient.name };
  };

  const handleCreateBarber = async (name) => {
    const res = await axios.post("/barbers", { name });
    const newBarber = res.data;

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
              await axios.delete(`/cuts/${id}`);
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
      {cuts.length === 0 ? (
        <div className="py-10 text-muted-foreground text-center">
          No hay registros todavía.
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {cuts.map((cut) => (
            <div key={cut.id} className="p-4 border rounded-lg">
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
                  onClick={() => navigate(`/cuts/${cut.id}`)}
                >
                  <EyeIcon />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openEdit(cut)}
                >
                  <PencilIcon />
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
      )}

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

                {/* Fotos */}
                <Field>
                  <FieldLabel>Fotos</FieldLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePhotoUpload(e.target.files, addForm)}
                  />
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
                            onClick={() => removePhoto(i, addForm)}
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

      {/* Drawer: Editar */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar corte</DrawerTitle>
          </DrawerHeader>

          <form
            id="formEditCut"
            onSubmit={editForm.handleSubmit(handleEditCut)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldLabel>Cliente</FieldLabel>
            <ComboboxCreate
              value={editForm.watch("clientId")}
              onChange={(v) => editForm.setValue("clientId", v)}
              items={clients.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              onCreate={handleCreateClient}
            />

            <FieldLabel>Barbero</FieldLabel>
            <ComboboxCreate
              value={editForm.watch("barberId")}
              onChange={(v) => editForm.setValue("barberId", v)}
              items={barbers.map((b) => ({
                value: String(b.id),
                label: b.name,
              }))}
              onCreate={handleCreateBarber}
            />

            <FieldLabel>Estilo</FieldLabel>
            <Input {...editForm.register("style")} placeholder="Estilo" />

            <FieldLabel>Notas</FieldLabel>
            <Input {...editForm.register("notes")} placeholder="Notas" />

            {/* Fotos existentes */}
            <FieldLabel>Fotos existentes</FieldLabel>
            {editing?.photos?.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {editing.photos.map((p) => (
                  <div key={p.id} className="group relative">
                    <img
                      src={`/api/cuts/${editing.id}/photos/${p.id}/data`}
                      alt="Foto existente"
                      className="border rounded-md w-20 h-20 object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveOldPhoto(p.id)}
                      className="top-1 right-1 absolute bg-black/60 opacity-0 group-hover:opacity-100 p-1 rounded-full text-white transition"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin fotos guardadas
              </p>
            )}

            {/* Fotos nuevas */}
            <FieldLabel>Añadir fotos nuevas</FieldLabel>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoUpload(e.target.files, editForm)}
            />
            {editForm.watch("photos")?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {editForm.watch("photos").map((photo, i) => (
                  <div key={i} className="group relative">
                    <img
                      src={photo.preview}
                      alt={`Nueva ${i + 1}`}
                      className="border rounded-md w-20 h-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i, editForm)}
                      className="top-1 right-1 absolute bg-black/60 opacity-0 group-hover:opacity-100 p-1 rounded-full text-white transition"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </form>

          <DrawerFooter>
            <Button type="submit" form="formEditCut">
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

// ------------ CutDetail ------------
function CutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/cuts");
        const all = res.data;
        const found = all.find((x) => String(x.id) === String(id));
        setData(found || null);
      } catch (err) {
        console.error("Error al cargar los cortes:", err);
      }
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
              await axios.delete(`/cuts/${data.id}/photos/${pid}`);

              const res = await axios.get("/cuts");
              const refreshed = res.data;

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
                to={`/clients/${data.client.id}`}
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
                to={`/barbers/${data.barber.id}`}
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

// ------------ Barbers ------------
function Barbers() {
  const [barbers, setBarbers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const formAdd = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Requerido"),
        bio: z.string().optional(),
      })
    ),
    defaultValues: { name: "", bio: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Requerido"),
        bio: z.string().optional(),
      })
    ),
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    (async () => {
      const res = await axios.get("/barbers");
      setBarbers(res.data);
    })();
  }, []);

  const refresh = async () => {
    const res = await axios.get("/barbers");
    setBarbers(res.data);
  };

  const onSubmitAdd = async (data) => {
    await axios.post("/barbers", data);
    formAdd.reset();
    await refresh();
    setIsAddOpen(false);
  };

  const onSubmitEdit = async (data) => {
    await toast.promise(
      axios.put(`/barbers/${editing.id}`, data).then(refresh),
      {
        loading: "Guardando cambios…",
        success: "Barbero actualizado",
        error: "Error al actualizar",
      }
    );
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    toast("¿Eliminar barbero?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(axios.delete(`/barbers/${id}`).then(refresh), {
            loading: "Eliminando…",
            success: "Barbero eliminado",
            error: "Error al eliminar",
          }),
      },
    });
  };

  const openEdit = (barber) => {
    setEditing(barber);
    formEdit.reset(barber);
    setIsEditOpen(true);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Barberos</h3>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon /> Añadir
        </Button>
      </div>

      {barbers.length === 0 ? (
        <div className="py-10 text-muted-foreground text-center">
          No hay registros todavía.
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {barbers.map((b) => (
            <div key={b.id} className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">{b.name}</h4>
              <p className="text-muted-foreground text-xs">
                {b.bio || "Sin bio"}
              </p>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigate(`/barbers/${b.id}`)}
                >
                  <EyeIcon />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openEdit(b)}
                >
                  <PencilIcon />
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
      )}

      {/* Drawer Añadir */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo barbero</DrawerTitle>
          </DrawerHeader>
          <form
            id="formAddBarber"
            onSubmit={formAdd.handleSubmit(onSubmitAdd)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formAdd.register("name")} placeholder="Nombre" />
              <FieldError>{formAdd.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bio</FieldLabel>
              <Textarea
                {...formAdd.register("bio")}
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

      {/* Drawer Editar */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar barbero</DrawerTitle>
          </DrawerHeader>
          <form
            id="formEditBarber"
            onSubmit={formEdit.handleSubmit(onSubmitEdit)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formEdit.register("name")} placeholder="Nombre" />
              <FieldError>{formEdit.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Bio</FieldLabel>
              <Textarea
                {...formEdit.register("bio")}
                placeholder="Descripción corta"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formEditBarber">
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

// ------------ BarberDetail ------------
function BarberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState(null);
  const [cuts, setCuts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [barbersRes, cutsRes] = await Promise.all([
          axios.get("/barbers"),
          axios.get("/cuts"),
        ]);

        const barbers = barbersRes.data;
        const allCuts = cutsRes.data;

        const b = barbers.find((x) => String(x.id) === String(id));
        setBarber(b || null);

        setCuts(
          allCuts.filter(
            (c) =>
              String(c.barberId) === String(id) ||
              String(c.barber?.id ?? "") === String(id)
          )
        );
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
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
            axios.delete(`/cuts/${cutId}`).then(() => {
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
                      onClick={() => navigate(`/cuts/${c.id}`)}
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  // ---------- Validación ----------
  const schema = z.object({
    name: z.string().min(1, "Requerido"),
    phone: z.string().optional(),
    notes: z.string().optional(),
  });

  const formAdd = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  const formEdit = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", notes: "" },
  });

  // ---------- Cargar clientes ----------
  useEffect(() => {
    (async () => {
      const res = await axios.get("/clients");
      setClients(res.data);
    })();
  }, []);

  const refresh = async () => {
    const res = await axios.get("/clients");
    setClients(res.data);
  };

  // ---------- Crear ----------
  const onSubmitAdd = async (data) => {
    await axios.post("/clients", data);
    formAdd.reset();
    await refresh();
    setIsAddOpen(false);
  };

  // ---------- Editar ----------
  const onSubmitEdit = async (data) => {
    await toast.promise(
      axios.put(`/clients/${editing.id}`, data).then(refresh),
      {
        loading: "Guardando cambios…",
        success: "Cliente actualizado",
        error: "Error al actualizar",
      }
    );
    setIsEditOpen(false);
  };

  const openEdit = (client) => {
    setEditing(client);
    formEdit.reset(client);
    setIsEditOpen(true);
  };

  // ---------- Eliminar ----------
  const handleDelete = (id) => {
    toast("¿Eliminar cliente?", {
      action: {
        label: "Eliminar",
        onClick: async () =>
          await toast.promise(axios.delete(`/clients/${id}`).then(refresh), {
            loading: "Eliminando…",
            success: "Cliente eliminado",
            error: "Error al eliminar",
          }),
      },
    });
  };

  // ---------- Render ----------
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Clientes</h3>
        <Button onClick={() => setIsAddOpen(true)}>
          <PlusIcon /> Añadir
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="py-10 text-muted-foreground text-center">
          No hay registros todavía.
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {clients.map((c) => (
            <div key={c.id} className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">{c.name}</h4>
              <p className="text-muted-foreground text-xs">{c.phone || "-"}</p>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <EyeIcon />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openEdit(c)}
                >
                  <PencilIcon />
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
      )}

      {/* Drawer Añadir */}
      <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuevo cliente</DrawerTitle>
          </DrawerHeader>
          <form
            id="formAddClient"
            onSubmit={formAdd.handleSubmit(onSubmitAdd)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formAdd.register("name")} placeholder="Nombre" />
              <FieldError>{formAdd.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input {...formAdd.register("phone")} placeholder="+54 9 ..." />
            </Field>
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...formAdd.register("notes")}
                placeholder="Observaciones"
              />
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

      {/* Drawer Editar */}
      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar cliente</DrawerTitle>
          </DrawerHeader>
          <form
            id="formEditClient"
            onSubmit={formEdit.handleSubmit(onSubmitEdit)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <Field>
              <FieldLabel>Nombre</FieldLabel>
              <Input {...formEdit.register("name")} placeholder="Nombre" />
              <FieldError>{formEdit.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input {...formEdit.register("phone")} placeholder="+54 9 ..." />
            </Field>
            <Field>
              <FieldLabel>Notas</FieldLabel>
              <Input
                {...formEdit.register("notes")}
                placeholder="Observaciones"
              />
            </Field>
          </form>
          <DrawerFooter>
            <Button type="submit" form="formEditClient">
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
      try {
        const [clientsRes, cutsRes] = await Promise.all([
          axios.get("/clients"),
          axios.get("/cuts"),
        ]);

        const clients = clientsRes.data;
        const allCuts = cutsRes.data;

        const c = clients.find((x) => String(x.id) === String(id));
        setClient(c || null);

        setCuts(
          allCuts.filter(
            (x) =>
              String(x.clientId) === String(id) ||
              String(x.client?.id ?? "") === String(id)
          )
        );
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
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
            axios.delete(`/cuts/${cutId}`).then(() => {
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
                      onClick={() => navigate(`/cuts/${c.id}`)}
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
