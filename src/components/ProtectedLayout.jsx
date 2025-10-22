import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import axios from "@/lib/axios";
import { useUserStore } from "@/stores/userStore";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";

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

  if (checking) return null;
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

export default ProtectedLayout;
