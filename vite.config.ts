import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// دامنه برای بیلد: ایران = asllmarket.ir ، خارج = asllmarket.com...
const BASE_DOMAIN = process.env.VITE_BASE_DOMAIN || "asllmarket.com";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BASE_DOMAIN__: JSON.stringify(BASE_DOMAIN),
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' }),
    {
      name: 'html-transform-base-domain',
      transformIndexHtml(html) {
        return html.replace(/\b__BASE_DOMAIN__\b/g, BASE_DOMAIN);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});