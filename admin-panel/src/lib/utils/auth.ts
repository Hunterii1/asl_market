/**
 * Authentication utilities
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  lastLogin?: string;
}

const AUTH_KEY = 'asll-auth';
const SESSION_KEY = 'asll-session';

export interface AuthSession {
  user: AdminUser;
  token: string;
  expiresAt: number;
  rememberMe: boolean;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): AdminUser | null {
  const session = getSession();
  if (!session?.user) return null;
  
  // Ensure alireza user has all permissions
  const username = session.user.username || session.user.email;
  const isAlireza = username && username.toLowerCase() === 'alireza';
  
  if (isAlireza) {
    return {
      ...session.user,
      role: 'super_admin',
      permissions: ['all'],
    };
  }
  
  return session.user;
}

/**
 * Get current session
 */
export function getSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: AuthSession = JSON.parse(stored);
    
    // Check if session is expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Set session
 */
export function setSession(user: AdminUser, token: string, rememberMe: boolean = false): void {
  const expiresAt = rememberMe
    ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    : Date.now() + 24 * 60 * 60 * 1000; // 1 day

  const session: AuthSession = {
    user,
    token,
    expiresAt,
    rememberMe,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(AUTH_KEY, 'true');
}

/**
 * Clear session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getSession();
  return session !== null;
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  const session = getSession();
  return session?.token || null;
}

/**
 * Login function - connects to real backend API
 */
export async function login(username: string, password: string, rememberMe: boolean = false): Promise<{ user: AdminUser; token: string }> {
  try {
    // Import adminApi dynamically to avoid circular dependencies
    const { adminApi } = await import('../api/adminApi');
    
    // Login only with username
    const response = await adminApi.login(username, password);
    
    // Transform backend user to AdminUser format
    const userUsername = response.user?.username || response.user?.telegram_id?.toString() || username;
    const isAlireza = userUsername.toLowerCase() === 'alireza';
    const isSuperAdmin = response.user?.is_admin || response.user?.role === 'super_admin' || isAlireza;
    
    const user: AdminUser = {
      id: response.user?.id?.toString() || response.user?.ID?.toString() || '0',
      name: response.user?.name || `${response.user?.first_name || ''} ${response.user?.last_name || ''}`.trim() || 'مدیر',
      email: response.user?.email || '',
      username: userUsername,
      role: isAlireza ? 'super_admin' : (response.user?.role || (isSuperAdmin ? 'super_admin' : 'admin')),
      permissions: isAlireza ? ['all'] : (response.user?.permissions || (isSuperAdmin ? ['all'] : [])),
      lastLogin: new Date().toLocaleDateString('fa-IR'),
    };

    return { user, token: response.token };
  } catch (error: any) {
    throw new Error(error.message || 'نام کاربری یا رمز عبور اشتباه است');
  }
}

/**
 * Logout function
 */
export async function logout(): Promise<void> {
  try {
    const { adminApi } = await import('../api/adminApi');
    adminApi.logout();
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearSession();
  }
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Forgot password function - connects to real backend API
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    // Use the same API base URL logic
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'asllmarket.ir' || hostname === 'www.asllmarket.ir') {
          return 'https://asllmarket.ir/backend/api/v1';
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '82.115.24.33') {
          return '/api/v1';
        }
      }
      return '/api/v1';
    };

    const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطا در ارسال ایمیل بازیابی رمز عبور');
    }
  } catch (error: any) {
    throw new Error(error.message || 'خطا در ارسال ایمیل بازیابی رمز عبور');
  }
}

