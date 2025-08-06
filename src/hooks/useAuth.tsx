import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, User, LoginRequest, RegisterRequest, LicenseStatus } from '@/services/api';
import { LicenseRequestModal } from '@/components/LicenseRequestModal';
import { licenseStorage } from '@/utils/licenseStorage';
import { errorHandler } from '@/utils/errorHandler';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
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
      console.error('License check failed:', error);
      
      // بررسی اینکه آیا خطا مربوط به لایسنس یا احراز هویت است
      const isLicenseError = errorHandler.handleLicenseError(error);
      const isAuthError = errorHandler.handleAuthError(error);
      
      if (!isLicenseError && !isAuthError) {
        // در صورت خطا، سعی در بازیابی از storage محلی
        if (user && licenseStorage.hasStoredLicense() && licenseStorage.isStoredLicenseValid()) {
          const recoveryAttempted = await licenseStorage.attemptLicenseRecovery(apiService);
          if (!recoveryAttempted) {
            setShowLicenseModal(true);
          }
        } else {
          setShowLicenseModal(true);
        }
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
    login,
    register,
    logout,
    checkAuth,
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