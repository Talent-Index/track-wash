import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { getRoleDashboard, getRoleOnboarding } from './ProtectedRoute';
import { Loader2 } from 'lucide-react';
import Landing from '@/pages/Landing';

export function RoleBasedRedirect() {
  const { isAuthenticated, role, loading: authLoading, initialized } = useAuth();
  const { business, operatorInfo, loading: roleDataLoading } = useUserRole();

  // Show loading while auth is initializing
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <Landing />;
  }

  // Wait for role data to load before redirecting
  if (roleDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine redirect based on role and onboarding status
  if (role === 'owner' || role === 'admin') {
    // Check if owner has a business set up
    if (!business) {
      return <Navigate to={getRoleOnboarding(role)} replace />;
    }
    return <Navigate to={getRoleDashboard(role)} replace />;
  }

  if (role === 'operator') {
    // Check if operator is assigned to a branch
    if (!operatorInfo) {
      return <Navigate to={getRoleOnboarding(role)} replace />;
    }
    return <Navigate to={getRoleDashboard(role)} replace />;
  }

  // Default: customer goes to dashboard
  return <Navigate to={getRoleDashboard(role)} replace />;
}
