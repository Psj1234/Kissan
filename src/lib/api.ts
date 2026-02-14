export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://kissan-backend-nntl.onrender.com";

export const apiUrl = (path: string) => {
  if (!path) {
    return API_BASE;
  }
  return path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
};
