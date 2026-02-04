import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// دامنه برای بیلد: ایران = asllmarket.ir ، خارج = asllmarket.com
const BASE_DOMAIN = process.env.VITE_BASE_DOMAIN || "asllmarket.com";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "html-transform-base-domain",
      transformIndexHtml(html) {
        return html.replace(/\b__BASE_DOMAIN__\b/g, BASE_DOMAIN);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
