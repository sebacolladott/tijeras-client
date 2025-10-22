import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  CircleUserRoundIcon,
  LogOutIcon,
  RectangleEllipsisIcon,
  ShieldIcon,
  SquareScissorsIcon,
  SquareUserIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

const changeSchema = z.object({
  oldPassword: z.string().min(6, "Minimo 6 caracteres"),
  newPassword: z.string().min(6, "Minimo 6 caracteres"),
});

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  const [isChangingOpen, setIsChangingOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  if (!user || location.pathname === "/login") return null;

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const changeForm = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email("Email invalido"),
        password: z.string().min(6, "Minimo 6 caracteres"),
        role: z.enum(["USER", "ADMIN"]).default("USER"),
      })
    ),
    defaultValues: { email: "", password: "", role: "USER" },
  });

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
        loading: "Registrando...",
        success: "Usuario creado",
        error: "Error al registrar",
      });
      registerForm.reset();
      setIsRegisterOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    await axios.post("/auth/logout");
    clearUser();
    navigate("/login", { replace: true });
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get("/users");
      setUsers(res.data.data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = (id) => {
    toast("¿Eliminar usuario?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          await toast.promise(
            (async () => {
              await axios.delete(`/users/${id}`);
              setUsers((prev) => prev.filter((u) => u.id !== id));
            })(),
            {
              loading: "Eliminando usuario...",
              success: "Usuario eliminado",
              error: "Error al eliminar",
            }
          );
        },
      },
    });
  };

  const toggleRole = async (target) => {
    const newRole = target.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await axios.put(`/users/${target.id}`, {
        email: target.email,
        role: newRole,
      });
      toast.success("Rol actualizado");
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u))
      );
    } catch {
      toast.error("Error al cambiar rol");
    }
  };

  useEffect(() => {
    if (isUsersOpen) fetchUsers();
  }, [isUsersOpen]);

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
            <SidebarGroupLabel>Aplicacion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/cuts")}>
                    <Link to="/cuts">
                      <SquareScissorsIcon />
                      Cortes
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/barbers")}>
                    <Link to="/barbers">
                      <SquareUserIcon />
                      Barberos
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/clients")}>
                    <Link to="/clients">
                      <CircleUserRoundIcon />
                      Clientes
                    </Link>
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

      <Drawer open={isChangingOpen} onOpenChange={setIsChangingOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Cambiar contraseña</DrawerTitle>
            <DrawerDescription>
              Ingresa tu contraseña actual y la nueva.
            </DrawerDescription>
          </DrawerHeader>

          <form
            id="changingForm"
            onSubmit={changeForm.handleSubmit(changePass)}
            className="flex-1 space-y-6 p-6 overflow-auto"
          >
            <FieldSet>
              <FieldGroup className="space-y-2">
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
              <FieldGroup className="space-y-2">
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
                    placeholder="********"
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

      <CommandDialog open={isUsersOpen} onOpenChange={setIsUsersOpen}>
        <CommandInput placeholder="Buscar usuario por email..." />
        <CommandList>
          {loadingUsers ? (
            <CommandEmpty>Cargando...</CommandEmpty>
          ) : users.length === 0 ? (
            <CommandEmpty>Sin usuarios registrados</CommandEmpty>
          ) : (
            <CommandGroup heading="Usuarios">
              {users
                .filter((item) => item.id !== user?.id)
                .map((item) => (
                  <CommandItem
                    key={item.id}
                    className="flex justify-between items-center px-2 py-1.5"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.email}</span>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        {item.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant={
                          item.role === "ADMIN" ? "secondary" : "outline"
                        }
                        className="w-7 h-7"
                        title={
                          item.role === "ADMIN"
                            ? "Quitar rol de admin"
                            : "Hacer administrador"
                        }
                        onClick={() => toggleRole(item)}
                      >
                        <ShieldIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="w-7 h-7"
                        title="Eliminar usuario"
                        onClick={() => deleteUser(item.id)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default AppSidebar;
