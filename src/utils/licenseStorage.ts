// License Storage Utility
// برای ذخیره محلی لایسنس در صورت پاک شدن cache

const LICENSE_STORAGE_KEY = 'asl_license_backup';
const LICENSE_INFO_KEY = 'asl_license_info';
const LICENSE_TIMESTAMP_KEY = 'asl_license_timestamp';

interface StoredLicenseInfo {
  license_code: string;
  activated_at: string;
  timestamp: number;
  user_email?: string;
}

class LicenseStorage {
  // ذخیره اطلاعات لایسنس به صورت محلی
  storeLicenseInfo(licenseCode: string, activatedAt: string, userEmail?: string) {
    const licenseInfo: StoredLicenseInfo = {
      license_code: licenseCode,
      activated_at: activatedAt,
      timestamp: Date.now(),
      user_email: userEmail,
    };

    try {
      // ذخیره در localStorage
      localStorage.setItem(LICENSE_INFO_KEY, JSON.stringify(licenseInfo));
      
      // ذخیره در sessionStorage به عنوان backup
      sessionStorage.setItem(LICENSE_INFO_KEY, JSON.stringify(licenseInfo));
      
      // ذخیره کد لایسنس به تنهایی
      localStorage.setItem(LICENSE_STORAGE_KEY, licenseCode);
      sessionStorage.setItem(LICENSE_STORAGE_KEY, licenseCode);
      
      // ذخیره timestamp
      localStorage.setItem(LICENSE_TIMESTAMP_KEY, Date.now().toString());
      
      console.log('🔐 License info stored locally');
    } catch (error) {
      console.error('❌ Failed to store license info:', error);
    }
  }

  // دریافت اطلاعات لایسنس از storage محلی
  getStoredLicenseInfo(): StoredLicenseInfo | null {
    try {
      // ابتدا از localStorage بخوان
      let stored = localStorage.getItem(LICENSE_INFO_KEY);
      
      // اگر در localStorage نبود، از sessionStorage بخوان
      if (!stored) {
        stored = sessionStorage.getItem(LICENSE_INFO_KEY);
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🔐 License info retrieved from local storage');
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve license info:', error);
      return null;
    }
  }

  // دریافت فقط کد لایسنس
  getStoredLicenseCode(): string | null {
    try {
      // ابتدا از localStorage بخوان
      let code = localStorage.getItem(LICENSE_STORAGE_KEY);
      
      // اگر در localStorage نبود، از sessionStorage بخوان
      if (!code) {
        code = sessionStorage.getItem(LICENSE_STORAGE_KEY);
      }
      
      if (code) {
        console.log('🔐 License code retrieved from local storage');
        return code;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve license code:', error);
      return null;
    }
  }

  // بررسی اینکه آیا لایسنس محلی وجود دارد
  hasStoredLicense(): boolean {
    return this.getStoredLicenseCode() !== null;
  }

  // پاک کردن اطلاعات لایسنس
  clearStoredLicense() {
    try {
      localStorage.removeItem(LICENSE_INFO_KEY);
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      localStorage.removeItem(LICENSE_TIMESTAMP_KEY);
      
      sessionStorage.removeItem(LICENSE_INFO_KEY);
      sessionStorage.removeItem(LICENSE_STORAGE_KEY);
      
      console.log('🧹 License info cleared from local storage');
    } catch (error) {
      console.error('❌ Failed to clear license info:', error);
    }
  }

  // بررسی اینکه آیا لایسنس محلی معتبر است (مثلاً کمتر از 30 روز قدیمی باشد)
  isStoredLicenseValid(): boolean {
    try {
      const timestampStr = localStorage.getItem(LICENSE_TIMESTAMP_KEY);
      if (!timestampStr) return false;
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 روز
      
      return (now - timestamp) < thirtyDaysInMs;
    } catch (error) {
      console.error('❌ Failed to validate stored license:', error);
      return false;
    }
  }

  // سعی در بازیابی لایسنس از سرور با استفاده از اطلاعات محلی
  async attemptLicenseRecovery(apiService: any): Promise<boolean> {
    const storedInfo = this.getStoredLicenseInfo();
    if (!storedInfo || !this.isStoredLicenseValid()) {
      return false;
    }

    try {
      // سعی در بررسی وضعیت لایسنس از سرور
      const status = await apiService.checkLicenseStatus();
      
      if (status.has_license && status.is_active) {
        console.log('✅ License recovered successfully from server');
        return true;
      }
      
      // اگر سرور لایسنس را تشخیص نداد، شاید نیاز به ورود مجدد باشد
      console.log('❓ Server does not recognize license, may need re-authentication');
      return false;
      
    } catch (error) {
      console.error('❌ License recovery failed:', error);
      return false;
    }
  }

  // نمایش اطلاعات لایسنس برای کاربر
  displayLicenseInfo(): string | null {
    const storedInfo = this.getStoredLicenseInfo();
    if (!storedInfo) return null;

    const date = new Date(storedInfo.activated_at);
    const formattedDate = date.toLocaleDateString('fa-IR');
    
    return `لایسنس: ${storedInfo.license_code}\nتاریخ فعال‌سازی: ${formattedDate}`;
  }
}

export const licenseStorage = new LicenseStorage();