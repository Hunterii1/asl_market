import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AslLearn from "./pages/AslLearn";
import AslSupplier from "./pages/AslSupplier";
import AslExpress from "./pages/AslExpress";
import AslVisit from "./pages/AslVisit";
import AslPay from "./pages/AslPay";
import AslAI from "./pages/AslAI";
import AslAvailable from "./pages/AslAvailable";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="asl-market-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/asllearn" element={<AslLearn />} />
            <Route path="/aslsupplier" element={<AslSupplier />} />
            <Route path="/aslexpress" element={<AslExpress />} />
            <Route path="/aslvisit" element={<AslVisit />} />
            <Route path="/aslpay" element={<AslPay />} />
            <Route path="/aslai" element={<AslAI />} />
            <Route path="/aslavailable" element={<AslAvailable />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
