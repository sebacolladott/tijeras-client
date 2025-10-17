import { Link, useLocation, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LogOutIcon,
  ScissorsIcon,
  UsersRoundIcon,
  UserIcon,
} from "lucide-react";
import axios from "@/lib/axios"; // con withCredentials activado
import { useUserStore } from "@/stores/userStore";

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);

  if (!user || location.pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch {
      // no pasa nada
    }
    clearUser();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex justify-center items-center bg-sidebar-primary rounded-lg size-8 aspect-square text-sidebar-primary-foreground">
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
                  <span className="text-xs truncate">0.0.1</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarMenu>
            {/* Ruta Cortés */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/")}>
                <Link to="/" className="flex items-center">
                  <ScissorsIcon className="mr-2 w-5 h-5" />
                  <span>Cortés</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Ruta Clientes */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/clients")}>
                <Link to="/clients" className="flex items-center">
                  <UsersRoundIcon className="mr-2 w-5 h-5" />
                  <span>Clientes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Ruta Barberos */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/barbers")}>
                <Link to="/barbers" className="flex items-center">
                  <UserIcon className="mr-2 w-5 h-5" />
                  <span>Barberos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOutIcon className="mr-2 w-5 h-5" />
              Cerrar sesión
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
