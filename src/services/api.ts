import { getErrorMessage, translateSuccess } from '@/utils/errorMessages';
import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production server
    if (hostname === 'asllmarket.com' || hostname === 'www.asllmarket.com') {
      return 'https://asllmarket.com/backend/api/v1';
    }
    
    // Development server - use proxy for testing
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '82.115.24.33') {
      return '/api/v1';
    }
  }
  
  // Fallback to proxy for development
  return '/api/v1';
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
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email?: string;
  password: string;
  phone: string;
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

export interface AIUsageResponse {
  date: string;
  message_count: number;
  remaining_count: number;
  daily_limit: number;
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
  expires_at: string;
  type: string;
  duration: number;
  remaining_days: number;
  remaining_hours: number;
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
      
      // Only add Content-Type for JSON requests (when body is not FormData)
      const defaultHeaders: Record<string, string> = {};
      if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
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

  async getAIUsage(): Promise<AIUsageResponse> {
    return this.makeRequest(`${API_BASE_URL}/ai/usage`, {
      method: 'GET',
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

  // Daily limits management
  async getDailyLimitsStatus(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/daily-limits`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async checkVisitorViewPermission(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/daily-limits/visitor-permission`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async checkSupplierViewPermission(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/daily-limits/supplier-permission`, {
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
    hs_code?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.status) queryParams.append('status', params.status);
    if (params.hs_code) queryParams.append('hs_code', params.hs_code);

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

  // Available Products API methods
  async getAvailableProducts(params: { page?: number; per_page?: number; category?: string; status?: string; featured_only?: boolean } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.status) queryParams.append('status', params.status);
    if (params.featured_only) queryParams.append('featured_only', 'true');
    
    const url = `/available-products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getAvailableProductCategories(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/available-products/categories`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getFeaturedAvailableProducts(limit: number = 10): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/available-products/featured?limit=${limit}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getHotDealsAvailableProducts(limit: number = 10): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/available-products/hot-deals?limit=${limit}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getAvailableProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/available-products/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async createAvailableProduct(data: {
    supplier_id?: number;
    product_name: string;
    category: string;
    subcategory?: string;
    description?: string;
    wholesale_price?: string;
    retail_price?: string;
    export_price?: string;
    currency?: string;
    available_quantity?: number;
    min_order_quantity?: number;
    max_order_quantity?: number;
    unit?: string;
    brand?: string;
    model?: string;
    origin?: string;
    quality?: string;
    packaging_type?: string;
    weight?: string;
    dimensions?: string;
    shipping_cost?: string;
    location: string;
    contact_phone?: string;
    contact_email?: string;
    contact_whatsapp?: string;
    can_export?: boolean;
    requires_license?: boolean;
    license_type?: string;
    export_countries?: string;
    image_urls?: string;
    video_url?: string;
    catalog_url?: string;
    is_featured?: boolean;
    is_hot_deal?: boolean;
    tags?: string;
    notes?: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async updateAvailableProduct(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteAvailableProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async updateAvailableProductStatus(id: number, status: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}/status`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
  }

  async submitAvailableProduct(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/submit-product`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  // User Product Management API methods
  async getUserProducts(params: {
    page?: number;
    per_page?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    return this.makeRequest(`${API_BASE_URL}/my-products?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getUserProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/my-products/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async updateUserProduct(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/my-products/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteUserProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/my-products/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
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

  // Contact View Limits API methods
  async getContactLimits(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/contact-limits`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async viewContactInfo(targetType: 'supplier' | 'visitor', targetId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/contact/view`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
      }),
    });
  }

  async getContactHistory(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/contact/history`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async checkCanViewContact(targetType: 'supplier' | 'visitor', targetId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/contact/check/${targetType}/${targetId}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Withdrawal API methods
  async createWithdrawalRequest(data: {
    amount: number;
    currency: string;
    source_country: string;
    bank_card_number: string;
    card_holder_name: string;
    sheba_number: string;
    bank_name: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/withdrawal/request`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async getUserWithdrawalRequests(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/withdrawal/requests`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getWithdrawalRequest(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/withdrawal/request/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getWithdrawalStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/withdrawal/stats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async uploadWithdrawalReceipt(id: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('receipt', file);

    return this.makeRequest(`${API_BASE_URL}/withdrawal/receipt/${id}`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
  }

  // Dashboard with withdrawal data
  async getDashboardData(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Progress tracking
  async getUserProgress(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/progress`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async updateUserProgress(activity: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/progress/update`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ activity }),
    });
  }

  // Training Videos API
  async getTrainingCategories(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/categories`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getAllTrainingVideos(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/videos`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getVideosByCategory(categoryId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/category/${categoryId}/videos`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getTrainingVideo(videoId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/video/${videoId}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async searchTrainingVideos(query: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/videos/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getTrainingStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/stats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Upgrade request methods
  async createUpgradeRequest(data: { to_plan: string; request_note?: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/upgrade/request`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async getUserUpgradeRequests(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/upgrade/requests`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Video Watching API
  async markVideoAsWatched(videoId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/video/${videoId}/watch`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
  }

  async getWatchedVideos(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/training/watched-videos`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // SpotPlayer API methods
  async generateSpotPlayerLicense(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/spotplayer/generate-license`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getSpotPlayerLicense(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/spotplayer/license`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Support Ticket API methods
  async createSupportTicket(data: {
    title: string;
    description: string;
    priority: string;
    category: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/support/tickets`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets(params: {
    page?: number;
    per_page?: number;
    status?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);

    return this.makeRequest(`${API_BASE_URL}/support/tickets?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getSupportTicket(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/support/tickets/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async addTicketMessage(id: number, data: { message: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/support/tickets/${id}/messages`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async closeSupportTicket(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/support/tickets/${id}/close`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Notification API methods
  async getNotifications(params: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.unread_only) queryParams.append('unread_only', params.unread_only.toString());

    return this.makeRequest(`${API_BASE_URL}/notifications?${queryParams}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getNotification(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/notifications/${id}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async markNotificationAsRead(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getUnreadNotificationCount(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  // Admin notification methods
  async createNotification(data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    user_id?: number;
    expires_at?: string;
    action_url?: string;
    action_text?: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async updateNotification(id: number, data: {
    title?: string;
    message?: string;
    type?: string;
    priority?: string;
    is_active?: boolean;
    expires_at?: string;
    action_url?: string;
    action_text?: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }

  async getNotificationStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/stats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
  }
}

export const apiService = new ApiService();