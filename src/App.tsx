import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/appStore";

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
  const { isAuthenticated, currentUser } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/detailer/home" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerHome /></ProtectedRoute>} />
            <Route path="/detailer/jobs" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerJobs /></ProtectedRoute>} />
            <Route path="/detailer/job/:id" element={<ProtectedRoute allowedRoles={['detailer']}><BookingDetail /></ProtectedRoute>} />
            <Route path="/detailer/earnings" element={<ProtectedRoute allowedRoles={['detailer']}><DetailerHome /></ProtectedRoute>} />
            <Route path="/detailer/onboarding" element={<Auth />} />
            
            {/* Admin */}
            <Route path="/admin/home" element={<ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/booking/:id" element={<ProtectedRoute allowedRoles={['admin']}><BookingDetail /></ProtectedRoute>} />
            <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/detailers" element={<ProtectedRoute allowedRoles={['admin']}><AdminDetailers /></ProtectedRoute>} />
            <Route path="/admin/businesses" element={<ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
