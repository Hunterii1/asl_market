import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '@/lib/utils/auth';

interface SupportAdminRouteProps {
  children: React.ReactNode;
}

/**
 * SupportAdminRoute - Only allows access to support admins
 * Support admins can only access tickets page
 */
export function SupportAdminRoute({ children }: SupportAdminRouteProps) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is support admin (moderator role)
  // In the system, support admins have role 'moderator' or 'support_admin'
  const isSupportAdmin = user?.role === 'moderator' || user?.role === 'support_admin';

  if (!isSupportAdmin) {
    // Redirect to main admin panel
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

