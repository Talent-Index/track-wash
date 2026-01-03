import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { ProtectedRoute, OwnerRoute, OperatorRoute, CustomerRoute } from "@/components/auth/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";

// Pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Owner pages
import OwnerOnboarding from "./pages/owner/OwnerOnboarding";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OperatorManagement from "./pages/owner/OperatorManagement";

// Operator pages
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorOnboarding from "./pages/operator/OperatorOnboarding";

// Customer pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";

// Legacy pages (keeping for backwards compatibility)
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/signup" element={<Navigate to="/auth" replace />} />
      
      {/* Owner routes */}
      <Route 
        path="/owner/onboarding" 
        element={
          <OwnerRoute>
            <OwnerOnboarding />
          </OwnerRoute>
        } 
      />
      <Route 
        path="/owner/dashboard" 
        element={
          <OwnerRoute>
            <OwnerDashboard />
          </OwnerRoute>
        } 
      />
      <Route 
        path="/owner/operators" 
        element={
          <OwnerRoute>
            <OperatorManagement />
          </OwnerRoute>
        } 
      />
      
      {/* Operator routes */}
      <Route 
        path="/operator/onboarding" 
        element={
          <ProtectedRoute>
            <OperatorOnboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/operator/dashboard" 
        element={
          <OperatorRoute>
            <OperatorDashboard />
          </OperatorRoute>
        } 
      />
      
      {/* Customer routes */}
      <Route 
        path="/customer/dashboard" 
        element={
          <CustomerRoute>
            <CustomerDashboard />
          </CustomerRoute>
        } 
      />
      
      {/* Shared routes */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy redirects */}
      <Route path="/admin/*" element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="/detailer/*" element={<Navigate to="/operator/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
