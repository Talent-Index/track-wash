import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading, initialized } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has one of them
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on actual role
    const redirectPath = getRoleDashboard(role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Role-specific route guards
export function OwnerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function OperatorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['operator']}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      {children}
    </ProtectedRoute>
  );
}

// Helper function to get dashboard path by role
export function getRoleDashboard(role: UserRole | null): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return '/owner/dashboard';
    case 'operator':
      return '/operator/dashboard';
    case 'customer':
    default:
      return '/customer/dashboard';
  }
}

// Helper function to get onboarding path by role
export function getRoleOnboarding(role: UserRole | null): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return '/owner/onboarding';
    case 'operator':
      return '/operator/onboarding';
    default:
      return '/customer/dashboard'; // Customers go directly to dashboard
  }
}
