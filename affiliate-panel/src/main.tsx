import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename="/affiliate">
    <App />
    <Toaster position="top-center" richColors />
  </BrowserRouter>
);
