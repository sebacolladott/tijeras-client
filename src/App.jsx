import { Routes, Route } from "react-router";
import Login from "@/pages/LoginPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

function App() {
  // useEffect(() => {
  //   const disableContextMenu = (e) => e.preventDefault();
  //   document.addEventListener("contextmenu", disableContextMenu);
  //   return () =>
  //     document.removeEventListener("contextmenu", disableContextMenu);
  // }, []);

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoute />} />
        </Routes>
      </SidebarInset>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
