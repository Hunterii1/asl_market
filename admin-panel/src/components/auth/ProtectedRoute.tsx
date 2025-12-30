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

  // Check route-level permissions if no specific permissions provided
  if (!requiredPermissions) {
    const canAccess = canAccessRoute(user?.permissions || [], location.pathname);
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

