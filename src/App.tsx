import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LicenseRequiredRoute } from "@/components/LicenseRequiredRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ErrorTestPanel } from "@/components/ErrorTestPanel";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AslLearn from "./pages/AslLearn";
import AslSupplier from "./pages/AslSupplier";
import AslExpress from "./pages/AslExpress";
import AslVisit from "./pages/AslVisit";
import AslPay from "./pages/AslPay";
import AslAI from "./pages/AslAI";
import AslAvailable from "./pages/AslAvailable";
import ProductsResearch from "./pages/ProductsResearch";
import SupplierRegistration from "./pages/SupplierRegistration";
import SupplierStatus from "./pages/SupplierStatus";

import VisitorRegistration from "./pages/VisitorRegistration";
import VisitorStatus from "./pages/VisitorStatus";
import ApprovedVisitors from "./pages/ApprovedVisitors";
import LicenseInfoPage from "./pages/LicenseInfoPage";
import PublicSupplierRegistration from "./pages/PublicSupplierRegistration";
import PublicVisitorRegistration from "./pages/PublicVisitorRegistration";
import RegistrationStatus from "./pages/RegistrationStatus";

import SubmitProduct from "./pages/SubmitProduct";
import MyProducts from "./pages/MyProducts";
import Notifications from "./pages/Notifications";
import SupportTicket from "./pages/SupportTicket";
import EditProfile from "./pages/EditProfile";
import EditVisitor from "./pages/EditVisitor";
import EditSupplier from "./pages/EditSupplier";
import CreateMatchingRequest from "./pages/CreateMatchingRequest";
import MyMatchingRequests from "./pages/MyMatchingRequests";
import AvailableMatchingRequests from "./pages/AvailableMatchingRequests";
import MatchingRequestDetails from "./pages/MatchingRequestDetails";
import MatchingChats from "./pages/MatchingChats";
import MatchingRatings from "./pages/MatchingRatings";
import AslMatch from "./pages/AslMatch";


const queryClient = new QueryClient();

// Component to initialize push notifications
const PushNotificationInitializer = () => {
  usePushNotifications(); // This will auto-subscribe when user is logged in
  return null;
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="dark" storageKey="asl-market-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PushNotificationInitializer />
            <NotificationPermissionPrompt />
            <Toaster />
            <Sonner />
            <ConnectionStatus />
            <ErrorTestPanel />
            <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<Index />} />
              
              {/* Public registration routes (no authentication required) */}
        <Route path="/public/supplier-registration" element={<PublicSupplierRegistration />} />
        <Route path="/public/visitor-registration" element={<PublicVisitorRegistration />} />
        <Route path="/public/registration-status" element={<RegistrationStatus />} />

              {/* Supplier routes */}
              <Route path="/supplier-registration" element={
                <ProtectedRoute>
                  <SupplierRegistration />
                </ProtectedRoute>
              } />
              <Route path="/supplier-status" element={
                <ProtectedRoute>
                  <SupplierStatus />
                </ProtectedRoute>
              } />


              {/* Visitor routes */}
              <Route path="/visitor-registration" element={
                <ProtectedRoute>
                  <VisitorRegistration />
                </ProtectedRoute>
              } />
                              <Route path="/visitor-status" element={
                  <ProtectedRoute>
                    <VisitorStatus />
                  </ProtectedRoute>
                } />
                <Route path="/approved-visitors" element={
                  <ProtectedRoute>
                    <ApprovedVisitors />
                  </ProtectedRoute>
                } />

                <Route path="/submit-product" element={
                  <ProtectedRoute>
                    <SubmitProduct />
                  </ProtectedRoute>
                } />
                <Route path="/my-products" element={
                  <ProtectedRoute>
                    <MyProducts />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/edit-profile" element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                } />
                <Route path="/edit-visitor" element={
                  <ProtectedRoute>
                    <EditVisitor />
                  </ProtectedRoute>
                } />
                <Route path="/edit-supplier" element={
                  <ProtectedRoute>
                    <EditSupplier />
                  </ProtectedRoute>
                } />
                
              
              {/* Protected routes - require authentication and license */}
              <Route path="/asllearn" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslLearn />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslsupplier" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslSupplier />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslexpress" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslExpress />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslvisit" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslVisit />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslpay" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslPay />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslai" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslAI />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/aslavailable" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <AslAvailable />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <LicenseRequiredRoute>
                    <ProductsResearch />
                  </LicenseRequiredRoute>
                </ProtectedRoute>
              } />
              <Route path="/license-info" element={
                <ProtectedRoute>
                  <LicenseInfoPage />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <SupportTicket />
                </ProtectedRoute>
              } />

              {/* ASL Match routes - Public access, no license required */}
              <Route path="/asl-match" element={<AslMatch />} />
              <Route path="/matching/create" element={
                <ProtectedRoute>
                  <CreateMatchingRequest />
                </ProtectedRoute>
              } />
              <Route path="/matching/my-requests" element={
                <ProtectedRoute>
                  <MyMatchingRequests />
                </ProtectedRoute>
              } />
              <Route path="/matching/available-requests" element={
                <ProtectedRoute>
                  <AvailableMatchingRequests />
                </ProtectedRoute>
              } />
              <Route path="/matching/requests/:id" element={
                <ProtectedRoute>
                  <MatchingRequestDetails />
                </ProtectedRoute>
              } />
              <Route path="/matching/chats" element={
                <ProtectedRoute>
                  <MatchingChats />
                </ProtectedRoute>
              } />
              <Route path="/matching/ratings" element={
                <ProtectedRoute>
                  <MatchingRatings />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
