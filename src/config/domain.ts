// Central place for frontend domain and API base URL logic
// Used by components that need to construct full backend URLs (e.g. video streaming)

// Base frontend/backend domain (without protocol or path)
// Decided at runtime based on current hostname.
export const BASE_DOMAIN = (() => {
  if (typeof window === 'undefined') {
    // Default to Iran domain on server-side; browser will override at runtime
    return 'asllmarket.ir';
  }

  const hostname = window.location.hostname;

  // Global (.com)
  if (hostname === 'aslmarket.com' || hostname === 'www.aslmarket.com' || hostname === 'admin.aslmarket.com') {
    return 'aslmarket.com';
  }

  // Iran (.ir) – main site or admin
  if (hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir' || hostname === 'admin.asllmarket.ir') {
    return 'asllmarket.ir';
  }

  // Fallback for local/dev
  return 'asllmarket.ir';
})();

// Determine API base URL based on current hostname
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Iran production (.ir)
    if (hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir') {
      return 'https://asllmarket.ir/backend/api/v1';
    }

    // Global production (.com)
    if (hostname === 'aslmarket.com' || hostname === 'www.aslmarket.com') {
      return 'https://aslmarket.com/backend/api/v1';
    }

    // Dev / local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '82.115.24.33') {
      return '/api/v1';
    }
  }

  // Fallback to proxy in unknown environments
  return '/api/v1';
};

