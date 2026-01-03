import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Web3Provider } from "@/components/providers/Web3Provider";

// Pages
import Landing from "./pages/Landing";
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

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}) {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'owner' || role === 'admin') {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (role === 'operator') {
      return <Navigate to="/operator/dashboard" replace />;
    } else {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Redirect based on role
  switch (role) {
    case 'owner':
    case 'admin':
      return <Navigate to="/owner/dashboard" replace />;
    case 'operator':
      return <Navigate to="/operator/dashboard" replace />;
    case 'customer':
    default:
      return <Navigate to="/customer/dashboard" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Owner routes */}
      <Route 
        path="/owner/onboarding" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <OwnerOnboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/operators" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <OperatorManagement />
          </ProtectedRoute>
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
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Customer routes */}
      <Route 
        path="/customer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
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
