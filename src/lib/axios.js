import axios from "axios";

// --- Configuración global de Axios ---
axios.defaults.baseURL = import.meta.env.VITE_API_URL?.trim(); // 🔥 elimina saltos o espacios
axios.defaults.withCredentials = true; // envía cookies automáticamente
axios.defaults.timeout = 0;

// --- Interceptor de respuesta ---
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const { response } = err;

    // Manejo de expiración de sesión
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
