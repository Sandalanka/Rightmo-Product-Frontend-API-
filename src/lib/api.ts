import axios from "axios";

// Shared axios instance. Set NEXT_PUBLIC_API_URL in .env.local to point at your backend.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://dummyjson.com",
  headers: { "Content-Type": "application/json" },
});

export default api;
