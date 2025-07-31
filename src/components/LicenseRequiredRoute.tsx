import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LicenseCheck } from './LicenseCheck';
import { Loader2 } from 'lucide-react';
import { apiService, LicenseStatus } from '@/services/api';

interface LicenseRequiredRouteProps {
  children: React.ReactNode;
}

export function LicenseRequiredRoute({ children }: LicenseRequiredRouteProps) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const data = await apiService.checkLicenseStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error checking license status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // Save the attempted URL for redirecting back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">در حال بررسی وضعیت لایسنس...</p>
        </div>
      </div>
    );
  }

  if (!status?.is_approved) {
    return <LicenseCheck />;
  }

  return <>{children}</>;
} 