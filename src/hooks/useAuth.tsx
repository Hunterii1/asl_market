import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, type User, type LoginRequest, type RegisterRequest, type LicenseStatus } from '@/services/api';
import { LicenseRequestModal } from '@/components/LicenseRequestModal';
import { licenseStorage } from '@/utils/licenseStorage';
import { errorHandler } from '@/utils/errorHandler';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  licenseStatus: LicenseStatus | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkLicenseStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

  const checkLicenseStatus = async () => {
    try {
      if (user) {
        const status = await apiService.checkLicenseStatus();
        
        // اگر status null بود، چک کن localStorage
        if (!status || status === null) {
          const storedLicense = localStorage.getItem('asl_license_code');
          if (storedLicense) {
            const fallbackStatus: LicenseStatus = {
              has_license: true,
              is_active: true,
              is_approved: true,
            };
            setLicenseStatus(fallbackStatus);
            return;
          }
        }
        
        setLicenseStatus(status);
        
        if (status.has_license && status.is_active) {
          // کاربر لایسنس دارد، اطلاعات لایسنس را دریافت و ذخیره کن
          try {
            const licenseInfo = await apiService.getLicenseInfo();
            licenseStorage.storeLicenseInfo(
              licenseInfo.license_code,
              licenseInfo.activated_at,
              user.email
            );
          } catch (err) {
            console.error('Failed to fetch license info:', err);
          }
        } else if (!status.has_license) {
          // کاربر لایسنس ندارد، سعی در بازیابی از storage محلی
          const recoveryAttempted = await licenseStorage.attemptLicenseRecovery(apiService);
          
          if (!recoveryAttempted) {
            setShowLicenseModal(true);
          }
        }
      }
    } catch (error) {
      // اگر خطا داد، مستقیماً از localStorage بخون
      const storedLicense = localStorage.getItem('asl_license_code');
      if (storedLicense && user) {
        // لایسنس در localStorage هست، پس فعاله
        const fallbackStatus: LicenseStatus = {
          has_license: true,
          is_active: true,
          is_approved: true,
        };
        setLicenseStatus(fallbackStatus);
      } else {
        // لایسنس نیست
        setLicenseStatus({
          has_license: false,
          is_active: false,
          is_approved: false,
        });
        setShowLicenseModal(true);
      }
    }
  };

  const checkAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        // Check license status after getting user data
        await checkLicenseStatus();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // استفاده از error handler
      errorHandler.handleAuthError(error);
      
      // Token might be expired, clear it
      apiService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const authData = await apiService.login(credentials);
      setUser(authData.user);
      // Check license status after login
      await checkLicenseStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      const authData = await apiService.register(userData);
      setUser(authData.user);
      // Check license status after registration
      await checkLicenseStatus();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        await checkLicenseStatus();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = () => {
    apiService.logout();
    licenseStorage.clearStoredLicense(); // پاک کردن اطلاعات لایسنس محلی
    setUser(null);
    setLicenseStatus(null);
    setShowLicenseModal(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    licenseStatus,
    login,
    register,
    logout,
    checkAuth,
    checkLicenseStatus,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLicenseModal && (
        <LicenseRequestModal onClose={() => setShowLicenseModal(false)} />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};