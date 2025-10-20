import axios from "axios";

// --- Configuración global de Axios ---
axios.defaults.baseURL = "/api";
axios.defaults.withCredentials = true; // 🔥 clave: envía cookies automáticamente

// Interceptor de respuesta para manejar expiración de sesión
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const { response } = err;
    if (response?.status === 401 || response?.status === 403) {
      const current = window.location.pathname;
      if (!current.startsWith("/login") && !current.startsWith("/reset")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default axios;
