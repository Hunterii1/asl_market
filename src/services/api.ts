import { getErrorMessage, translateSuccess } from '@/utils/errorMessages';
import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
      return 'https://asllmarket.com/backend/api/v1';
    }
  }
  return 'http://localhost:8080/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🏠 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  license?: string;
  is_approved?: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

// Chat interfaces
export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ChatRequest {
  message: string;
  chat_id?: number;
}

export interface ChatResponse {
  chat_id: number;
  message: string;
  response: string;
  messages: Message[];
}

export interface ChatsResponse {
  chats: Chat[];
}

export interface LicenseRequest {
  license: string;
}

export interface LicenseStatus {
  is_approved: boolean;
  has_license: boolean;
  is_active: boolean;
}

export interface LicenseInfo {
  license_code: string;
  activated_at: string;
  is_active: boolean;
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    console.log('🔑 Token from localStorage:', token ? 'exists' : 'missing');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { 
          error: 'خطا در دریافت پاسخ از سرور',
          statusCode: response.status 
        };
      }

      // اضافه کردن status code به error data
      errorData.statusCode = response.status;
      
      // استفاده از error handler جدید
      const errorMessage = errorHandler.handleApiError({
        response: {
          data: errorData,
          status: response.status
        }
      }, 'خطا در درخواست به سرور');
      
      throw new Error(errorMessage);
    }
    return response.json();
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    try {
      console.log(`🌐 Making request to: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error(`❌ Network error for ${url}:`, error);
      
      // استفاده از error handler برای خطاهای شبکه
      const errorMessage = errorHandler.handleApiError(error, 'خطا در ارتباط با سرور');
      
      throw new Error(errorMessage);
    }
  }

  private showSuccessToast(message: string) {
    const persianMessage = translateSuccess(message);
    errorHandler.showSuccess(persianMessage);
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await this.makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in localStorage
    if (data.data?.token) {
      console.log('💾 Storing login token:', data.data.token.substring(0, 20) + '...');
      localStorage.setItem('auth_token', data.data.token);
      this.showSuccessToast('Login successful');
    } else {
      console.error('❌ No token in login response:', data);
    }
    
    return data.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const data = await this.makeRequest(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token in localStorage
    if (data.data?.token) {
      console.log('💾 Storing register token:', data.data.token.substring(0, 20) + '...');
      localStorage.setItem('auth_token', data.data.token);
      this.showSuccessToast('Registration successful');
    } else {
      console.error('❌ No token in register response:', data);
    }
    
    return data.data;
  }

  async getCurrentUser(): Promise<User> {
    const data = await this.makeRequest(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    return data.data;
  }

  // Public routes
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async getSuppliers() {
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  // Protected routes
  async getUserDashboard() {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async getUserOrders() {
    const response = await fetch(`${API_BASE_URL}/my-orders`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async getUserProducts() {
    const response = await fetch(`${API_BASE_URL}/my-products`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  // AI Chat methods
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });
  }

  async getChats(): Promise<ChatsResponse> {
    return this.makeRequest(`${API_BASE_URL}/ai/chats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getChat(chatId: number): Promise<{ chat: Chat }> {
    return this.makeRequest(`${API_BASE_URL}/ai/chats/${chatId}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async deleteChat(chatId: number): Promise<{ message: string }> {
    return this.makeRequest(`${API_BASE_URL}/ai/chats/${chatId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // License methods
  async verifyLicense(license: string): Promise<{ message: string; status: string }> {
    return this.makeRequest(`${API_BASE_URL}/license/verify`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ license }),
    });
  }

  async checkLicenseStatus(): Promise<LicenseStatus> {
    return this.makeRequest(`${API_BASE_URL}/license/status`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getLicenseInfo(): Promise<LicenseInfo> {
    return this.makeRequest(`${API_BASE_URL}/license/info`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Supplier APIs
  async registerSupplier(supplierData: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/supplier/register`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(supplierData),
    });
  }

  async getSupplierStatus(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/supplier/status`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getApprovedSuppliers(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/suppliers`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Visitor methods
  async registerVisitor(visitorData: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/visitor/register`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(visitorData),
    });
  }

  async getMyVisitorStatus(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/visitor/status`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getApprovedVisitors(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/visitors`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getVisitorsForAdmin(params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    return this.makeRequest(`${API_BASE_URL}/admin/visitors?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getVisitorDetails(visitorId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${visitorId}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async approveVisitor(visitorId: number, data: { admin_notes?: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${visitorId}/approve`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async rejectVisitor(visitorId: number, data: { admin_notes: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${visitorId}/reject`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async updateVisitorStatus(visitorId: number, data: { status: string; admin_notes?: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${visitorId}/status`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  // Auth helpers
  logout() {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Research Products API methods
  async getResearchProducts(params: {
    page?: number;
    per_page?: number;
    category?: string;
    status?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.status) queryParams.append('status', params.status);

    return this.makeRequest(`${API_BASE_URL}/research-products?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getActiveResearchProducts(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/research-products/active`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getResearchProductCategories(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/research-products/categories`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getResearchProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/research-products/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Admin methods for research products
  async createResearchProduct(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async updateResearchProduct(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteResearchProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async updateResearchProductStatus(id: number, status: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}/status`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
  }

  // Marketing Popup API methods
  async getActiveMarketingPopup(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/marketing-popups/active`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async trackPopupClick(popupId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/marketing-popups/${popupId}/click`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getMarketingPopups(params: {
    page?: number;
    per_page?: number;
    active_only?: boolean;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.active_only) queryParams.append('active_only', params.active_only.toString());

    return this.makeRequest(`${API_BASE_URL}/marketing-popups?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getMarketingPopup(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/marketing-popups/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async createMarketingPopup(data: {
    title: string;
    message: string;
    discount_url?: string;
    button_text?: string;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
    priority?: number;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async updateMarketingPopup(id: number, data: {
    title: string;
    message: string;
    discount_url?: string;
    button_text?: string;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
    priority?: number;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteMarketingPopup(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const apiService = new ApiService(); 