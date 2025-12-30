import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '@/lib/utils/auth';
import { canAccessRoute } from '@/lib/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[]; // Optional: specific permissions required for this route
}

export function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  if (!authenticated) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is alireza (super admin) - should have access to everything
  const username = user?.username || user?.email || '';
  const isAlireza = username.toLowerCase() === 'alireza';
  const isSuperAdmin = user?.role === 'super_admin' || isAlireza;
  
  // If super admin, allow access to all routes
  if (isSuperAdmin) {
    return <>{children}</>;
  }
  
  // Check route-level permissions if no specific permissions provided
  if (!requiredPermissions) {
    const canAccess = canAccessRoute(user?.permissions || [], location.pathname, username, user?.role);
    if (!canAccess) {
      // Redirect to dashboard if no access
      return <Navigate to="/" replace />;
    }
  } else if (requiredPermissions.length > 0) {
    // Check specific permissions if provided
    const userPermissions = user?.permissions || [];
    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm) || userPermissions.includes('all')
    );
    
    if (!hasPermission) {
      // Redirect to dashboard if no access
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

