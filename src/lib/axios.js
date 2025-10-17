import axios from "axios";

// --- Configuración global de Axios ---
axios.defaults.baseURL = "/api";
axios.defaults.withCredentials = true; // 🔥 clave: envía cookies automáticamente

// Interceptor de respuesta para manejar expiración de sesión
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Redirigir si la sesión expiró o es inválida
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
