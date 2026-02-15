import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  // @ts-expect-error - test config is valid but types require vitest package
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
