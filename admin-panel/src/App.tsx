import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Users from "./pages/Users";
import AvailableProducts from "./pages/AvailableProducts";
import ResearchProducts from "./pages/ResearchProducts";
import Admins from "./pages/Admins";
import Statistics from "./pages/Statistics";
import Withdrawals from "./pages/Withdrawals";
import Licenses from "./pages/Licenses";
import Suppliers from "./pages/Suppliers";
import Visitors from "./pages/Visitors";
import Popups from "./pages/Popups";
import Sliders from "./pages/Sliders";
import Notifications from "./pages/Notifications";
// import Export from "./pages/Export";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SupportAdminRoute } from "./components/auth/SupportAdminRoute";
import SupportTickets from "./pages/SupportTickets";
import Affiliates from "./pages/Affiliates";
import AdminMatchingRequests from "./pages/AdminMatchingRequests";
import AdminVisitorProjects from "./pages/AdminVisitorProjects";
import AdminChats from "./pages/AdminChats";

const queryClient = new QueryClient();

// Initialize dark mode
function ThemeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem('asll-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInitializer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/available"
            element={
              <ProtectedRoute>
                <AvailableProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/research"
            element={
              <ProtectedRoute>
                <ResearchProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <ProtectedRoute>
                <Admins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/affiliates"
            element={
              <ProtectedRoute>
                <Affiliates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/withdrawals"
            element={
              <ProtectedRoute>
                <Withdrawals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/licenses"
            element={
              <ProtectedRoute>
                <Licenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <SupportTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/tickets"
            element={
              <SupportAdminRoute>
                <SupportTickets />
              </SupportAdminRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitors"
            element={
              <ProtectedRoute>
                <Visitors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/popups"
            element={
              <ProtectedRoute>
                <Popups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sliders"
            element={
              <ProtectedRoute>
                <Sliders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching/requests"
            element={
              <ProtectedRoute>
                <AdminMatchingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching/projects"
            element={
              <ProtectedRoute>
                <AdminVisitorProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matching/chats"
            element={
              <ProtectedRoute>
                <AdminChats />
              </ProtectedRoute>
            }
          />
          {/* Export route - Commented out */}
          {/* <Route
            path="/export"
            element={
              <ProtectedRoute>
                <Export />
              </ProtectedRoute>
            }
          /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
