import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://user-admin-monitoring-system-1.onrender.com",
});

export default api;
