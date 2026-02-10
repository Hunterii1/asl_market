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
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

  const checkLicenseStatus = async () => {
    console.log('📋 checkLicenseStatus called, user:', user?.email || 'no user');
    try {
      // وضعیت لایسنس را همیشه از API بگیر؛ وابسته به state فعلی user نباش
      const status = await apiService.checkLicenseStatus();
      console.log('✅ License status received:', status);

      // اگر status null بود، چک کن localStorage (هرچند در apiService هم هندل شده)
      if (!status || status === null) {
        console.log('⚠️ Status is null, checking localStorage');
        const storedLicense = localStorage.getItem('asl_license_code');
        if (storedLicense) {
          const fallbackStatus: LicenseStatus = {
            has_license: true,
            is_active: true,
            is_approved: true,
          };
          console.log('✅ Using fallback from localStorage:', fallbackStatus);
          setLicenseStatus(fallbackStatus);
          return;
        }
        console.log('❌ No license in localStorage, setting to false');
        setLicenseStatus({
          has_license: false,
          is_active: false,
          is_approved: false,
        });
        return;
      }
      
      console.log('💾 Setting license status:', status);
      setLicenseStatus(status);
      
      if (status.has_license && status.is_active) {
        console.log('🎫 User has active license, fetching license info...');
        // کاربر لایسنس دارد، اطلاعات لایسنس را دریافت و در صورت داشتن user ذخیره کن
        try {
          const licenseInfo = await apiService.getLicenseInfo();
          console.log('📄 License info received:', licenseInfo);
          if (user) {
            licenseStorage.storeLicenseInfo(
              licenseInfo.license_code,
              licenseInfo.activated_at,
              user.email
            );
            console.log('💾 License info stored');
          }
        } catch (err) {
          console.error('❌ Failed to fetch license info:', err);
        }
      } else if (!status.has_license) {
        console.log('⚠️ User has no license');
        // فقط وضعیت را ست می‌کنیم، بدون نمایش modal
        // کاربر می‌تواند بدون لایسنس هم وارد شود
        // modal فقط در صفحات خاص (مثل LicenseRequiredRoute) نمایش داده می‌شود
      }
    } catch (error) {
      console.error('❌ Error in checkLicenseStatus:', error);
      // اگر خطا داد، مستقیماً از localStorage بخون
      const storedLicense = localStorage.getItem('asl_license_code');
      if (storedLicense && user) {
        console.log('✅ Error fallback: using localStorage license');
        // لایسنس در localStorage هست، پس فعاله
        const fallbackStatus: LicenseStatus = {
          has_license: true,
          is_active: true,
          is_approved: true,
        };
        setLicenseStatus(fallbackStatus);
      } else {
        console.log('❌ Error fallback: no license');
        // لایسنس نیست، فقط وضعیت را ست می‌کنیم
        setLicenseStatus({
          has_license: false,
          is_active: false,
          is_approved: false,
        });
      }
    }
  };

  const checkAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
        // License status will be checked in the useEffect when user changes
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
      // License status will be checked in the useEffect when user changes
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
      // License status will be checked in the useEffect when user changes
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
        // License status will be checked in the useEffect when user changes
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
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Check license whenever user changes (after login, register, or refresh)
  useEffect(() => {
    if (user) {
      console.log('🔄 User changed, checking license status...');
      checkLicenseStatus().catch(err => {
        console.error('❌ Error in checkLicenseStatus:', err);
      });
    } else {
      console.log('⏸️ User is null, skipping license check');
    }
  }, [user]);

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