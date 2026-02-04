const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Global (.com)
    if (hostname === "asllmarket.com" || hostname === "www.asllmarket.com") {
      return "https://asllmarket.com/backend/api/v1";
    }
    // Iran (.ir)
    if (hostname === "asllmarket.ir" || hostname === "www.asllmarket.ir") {
      return "https://asllmarket.ir/backend/api/v1";
    }
    // Dev / local
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "/api/v1";
    }
  }
  return "/api/v1";
};

const AFFILIATE_SESSION_KEY = "asll-affiliate-session";

export interface AffiliateUser {
  id: number;
  name: string;
  username: string;
  referral_code: string;
  balance: number;
  total_earnings: number;
}

export function getAffiliateToken(): string | null {
  try {
    const s = localStorage.getItem(AFFILIATE_SESSION_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function setAffiliateSession(user: AffiliateUser, token: string) {
  localStorage.setItem(AFFILIATE_SESSION_KEY, JSON.stringify({ user, token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }));
}

export function clearAffiliateSession() {
  localStorage.removeItem(AFFILIATE_SESSION_KEY);
}

export function getAffiliateUser(): AffiliateUser | null {
  try {
    const s = localStorage.getItem(AFFILIATE_SESSION_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

const API = getApiBaseUrl();

async function request(path: string, options: RequestInit = {}) {
  const token = getAffiliateToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "خطا در ارتباط با سرور");
  }
  return res.json();
}

export const affiliateApi = {
  async login(username: string, password: string) {
    const data = await request("/auth/affiliate/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return data;
  },
  async getDashboard() {
    const data = await request("/affiliate/dashboard");
    return data?.data ?? data;
  },
  async getUsers(params?: { page?: number; per_page?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.per_page) q.set("per_page", String(params.per_page));
    const data = await request(`/affiliate/users?${q}`);
    return data?.data ?? data;
  },
  async getPayments() {
    const data = await request("/affiliate/payments");
    return data?.data ?? data;
  },
  async createWithdrawalRequest(body: { amount: number; bank_card_number?: string; card_holder_name?: string; sheba_number?: string; bank_name?: string }) {
    const data = await request("/affiliate/withdrawal-request", { method: "POST", body: JSON.stringify(body) });
    return data?.data ?? data;
  },
  async getWithdrawalRequests(params?: { page?: number; per_page?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.per_page) q.set("per_page", String(params.per_page));
    const data = await request(`/affiliate/withdrawal-requests?${q}`);
    return data?.data ?? data;
  },
};
