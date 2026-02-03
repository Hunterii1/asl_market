import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "/affiliate/",
  server: {
    port: 5175,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/backend": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
