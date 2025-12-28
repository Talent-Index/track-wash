import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Web3Provider } from "@/components/providers/Web3Provider";

// Pages
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import NewBooking from "./pages/booking/NewBooking";
import BookingDetail from "./pages/booking/BookingDetail";
import Loyalty from "./pages/Loyalty";
import History from "./pages/History";
import Profile from "./pages/Profile";
import DetailerHome from "./pages/detailer/DetailerHome";
import DetailerJobs from "./pages/detailer/DetailerJobs";
import AdminHome from "./pages/admin/AdminHome";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminDetailers from "./pages/admin/AdminDetailers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/explore" element={<Explore />} />
        
        {/* Customer */}
        <Route path="/booking/new" element={<ProtectedRoute><NewBooking /></ProtectedRoute>} />
        <Route path="/booking/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
        <Route path="/loyalty" element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Detailer */}
        <Route path="/detailer/home" element={<ProtectedRoute allowedRoles={['operator']}><DetailerHome /></ProtectedRoute>} />
        <Route path="/detailer/jobs" element={<ProtectedRoute allowedRoles={['operator']}><DetailerJobs /></ProtectedRoute>} />
        <Route path="/detailer/job/:id" element={<ProtectedRoute allowedRoles={['operator']}><BookingDetail /></ProtectedRoute>} />
        <Route path="/detailer/earnings" element={<ProtectedRoute allowedRoles={['operator']}><DetailerHome /></ProtectedRoute>} />
        <Route path="/detailer/onboarding" element={<Auth />} />
        
        {/* Admin */}
        <Route path="/admin/home" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/booking/:id" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><BookingDetail /></ProtectedRoute>} />
        <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminPayouts /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/detailers" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminDetailers /></ProtectedRoute>} />
        <Route path="/admin/businesses" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminHome /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
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
