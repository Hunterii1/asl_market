/**
 * Admin Panel API Service
 * اتصال به Backend اصلی پروژه ASL Market
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Admin Panel Production
    if (hostname === 'admin.asllmarket.com') {
      return 'https://admin.asllmarket.com/api/v1';
    }
    
    // Main site Production
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

class AdminApiService {
  getApiBaseUrl() {
    return API_BASE_URL;
  }

  getAuthHeaders() {
    try {
      const session = localStorage.getItem('asll-session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.token) {
          return { Authorization: `Bearer ${parsed.token}` };
        }
      }
      // Fallback to old auth_token
      const token = localStorage.getItem('auth_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      const token = localStorage.getItem('auth_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
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
      
      // Include status code in error message for 404 detection
      const errorMessage = errorData.error || errorData.message || 'خطا در دریافت پاسخ از سرور';
      const error = new Error(`${errorMessage} (${response.status})`);
      (error as any).statusCode = response.status;
      throw error;
    }
    const data = await response.json();
    // Backend may return { data: {...} } or { success: true, ... } or direct data
    // Return data.data if it exists, otherwise return the whole response
    if (data.data !== undefined) {
      return data.data;
    }
    return data;
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const defaultHeaders: Record<string, string> = {};
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });
    return this.handleResponse(response);
  }

  // ==================== Authentication ====================
  async login(emailOrUsername: string, password: string): Promise<{ user: any; token: string }> {
    // Support login with email, username, or telegram_id
    const payload: { email?: string; username?: string; password: string } = {
      password,
    };
    
    // Check if it's a telegram_id (numeric string)
    if (/^\d+$/.test(emailOrUsername)) {
      payload.username = emailOrUsername;
    } else if (emailOrUsername.includes('@')) {
      payload.email = emailOrUsername;
    } else {
      payload.username = emailOrUsername;
    }
    
    const data = await this.makeRequest(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    // Store token in both formats for compatibility
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  }

  async getCurrentUser(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/me`, {
      method: 'GET',
    });
  }

  logout() {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // ==================== Users Management ====================
  async getUsers(params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    return this.makeRequest(`${API_BASE_URL}/admin/users?${queryParams}`, {
      method: 'GET',
    });
  }

  async getUser(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'GET',
    });
  }

  async createUser(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<any> {
    // Ensure boolean is properly sent - backend expects is_active as boolean
    const payload = { is_active: isActive };
    
    // Make direct fetch call to ensure proper JSON encoding
    const url = `${API_BASE_URL}/admin/users/${id}/status`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    
    return this.handleResponse(response);
  }

  async deleteUser(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/users/stats`, {
      method: 'GET',
    });
  }

  // ==================== Suppliers Management ====================
  async getSuppliers(params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    return this.makeRequest(`${API_BASE_URL}/admin/suppliers?${queryParams}`, {
      method: 'GET',
    });
  }

  async getSupplier(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}`, {
      method: 'GET',
    });
  }

  async approveSupplier(id: number, data: { admin_notes?: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectSupplier(id: number, data: { admin_notes: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  async featureSupplier(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}/feature`, {
      method: 'POST',
    });
  }

  async unfeatureSupplier(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/${id}/unfeature`, {
      method: 'POST',
    });
  }

  async getSupplierStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/suppliers/stats`, {
      method: 'GET',
    });
  }

  // ==================== Visitors Management ====================
  async getVisitors(params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    return this.makeRequest(`${API_BASE_URL}/admin/visitors?${queryParams}`, {
      method: 'GET',
    });
  }

  async getVisitor(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}`, {
      method: 'GET',
    });
  }

  async approveVisitor(id: number, data: { admin_notes?: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rejectVisitor(id: number, data: { admin_notes: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisitor(id: number, data: {
    full_name?: string;
    mobile?: string;
    email?: string;
    city_province?: string;
    destination_cities?: string;
    admin_notes?: string;
    status?: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVisitor(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}`, {
      method: 'DELETE',
    });
  }

  async featureVisitor(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}/feature`, {
      method: 'POST',
    });
  }

  async unfeatureVisitor(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/${id}/unfeature`, {
      method: 'POST',
    });
  }

  async getVisitorStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/visitors/stats`, {
      method: 'GET',
    });
  }

  // ==================== Licenses Management ====================
  async generateLicenses(count: number, type: 'pro' | 'plus' | 'plus4'): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/licenses/generate`, {
      method: 'POST',
      body: JSON.stringify({ count, type }),
    });
  }

  async getLicenses(params: {
    page?: number;
    per_page?: number;
    status?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);

    return this.makeRequest(`${API_BASE_URL}/admin/licenses?${queryParams}`, {
      method: 'GET',
    });
  }

  async getLicense(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/licenses/${id}`, {
      method: 'GET',
    });
  }

  async deleteLicense(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/licenses/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Withdrawals Management ====================
  async getWithdrawals(params: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    return this.makeRequest(`${API_BASE_URL}/admin/withdrawal/requests?${queryParams}`, {
      method: 'GET',
    });
  }

  async getWithdrawal(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/withdrawal/request/${id}`, {
      method: 'GET',
    });
  }

  async updateWithdrawalStatus(
    id: number, 
    data: { 
      status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
      admin_notes?: string;
      destination_account?: string;
    }
  ): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/withdrawal/request/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approveWithdrawal(id: number, data: { receipt_url?: string; admin_notes?: string } = {}): Promise<any> {
    return this.updateWithdrawalStatus(id, { 
      status: 'approved',
      ...data 
    });
  }

  async rejectWithdrawal(id: number, data: { admin_notes?: string } = {}): Promise<any> {
    return this.updateWithdrawalStatus(id, { 
      status: 'rejected',
      ...data 
    });
  }

  async deleteWithdrawal(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/withdrawal/request/${id}`, {
      method: 'DELETE',
    });
  }

  async getWithdrawalStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/withdrawal/stats`, {
      method: 'GET',
    });
  }

  // ==================== Support Tickets Management ====================
  async getTickets(params: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    return this.makeRequest(`${API_BASE_URL}/admin/support/tickets?${queryParams}`, {
      method: 'GET',
    });
  }

  async getTicket(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/support/tickets/${id}`, {
      method: 'GET',
    });
  }

  async updateTicketStatus(
    id: number, 
    data: { 
      status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
      message?: string;
    }
  ): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/support/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addAdminMessageToTicket(id: number, data: { message: string }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTicketStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/support/tickets/stats`, {
      method: 'GET',
    });
  }

  // ==================== Training/Education Management ====================
  async getTrainingCategories(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/categories`, {
      method: 'GET',
    });
  }

  async createTrainingCategory(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrainingVideos(params: {
    page?: number;
    per_page?: number;
    category_id?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());

    return this.makeRequest(`${API_BASE_URL}/admin/training/videos?${queryParams}`, {
      method: 'GET',
    });
  }

  async createTrainingVideo(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/videos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrainingVideo(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTrainingVideo(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/videos/${id}`, {
      method: 'DELETE',
    });
  }

  async getTrainingStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/training/stats`, {
      method: 'GET',
    });
  }

  // ==================== Research Products Management ====================
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
    });
  }

  async getResearchProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/research-products/${id}`, {
      method: 'GET',
    });
  }

  async createResearchProduct(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateResearchProduct(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteResearchProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateResearchProductStatus(id: number, status: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/research-products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ==================== Available Products Management ====================
  async getAvailableProducts(params: {
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

    return this.makeRequest(`${API_BASE_URL}/available-products?${queryParams}`, {
      method: 'GET',
    });
  }

  async getAvailableProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/available-products/${id}`, {
      method: 'GET',
    });
  }

  async createAvailableProduct(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAvailableProduct(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAvailableProduct(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateAvailableProductStatus(id: number, status: string): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/available-products/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Legacy methods for backward compatibility
  async getProducts(params: {
    page?: number;
    per_page?: number;
    category?: string;
    status?: string;
  } = {}): Promise<any> {
    return this.getAvailableProducts(params);
  }

  async getProduct(id: number): Promise<any> {
    return this.getAvailableProduct(id);
  }

  async createProduct(data: any): Promise<any> {
    return this.createAvailableProduct(data);
  }

  async updateProduct(id: number, data: any): Promise<any> {
    return this.updateAvailableProduct(id, data);
  }

  async deleteProduct(id: number): Promise<any> {
    return this.deleteAvailableProduct(id);
  }

  // ==================== Marketing Popups Management ====================
  async getPopups(params: {
    page?: number;
    per_page?: number;
    active_only?: boolean;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.active_only) queryParams.append('active_only', params.active_only.toString());

    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups?${queryParams}`, {
      method: 'GET',
    });
  }

  async getPopup(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups/${id}`, {
      method: 'GET',
    });
  }

  async createPopup(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePopup(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePopup(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/marketing-popups/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Notifications Management ====================
  async getNotifications(params: {
    page?: number;
    per_page?: number;
    status?: string;
    type?: string;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);

    return this.makeRequest(`${API_BASE_URL}/admin/notifications?${queryParams}`, {
      method: 'GET',
    });
  }

  async getNotification(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/${id}`, {
      method: 'GET',
    });
  }

  async createNotification(data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNotification(id: number, data: any): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotificationStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/notifications/stats`, {
      method: 'GET',
    });
  }

  // ==================== Dashboard Stats ====================
  async getDashboardStats(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/dashboard/stats`, {
      method: 'GET',
    });
  }

  // ==================== Excel Export ====================
  async exportSuppliers(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/export/suppliers`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error('خطا در دریافت فایل Excel');
    }
    const data = await response.json();
    if (data.url) {
      window.open(data.url, '_blank');
    }
    return data;
  }

  async exportVisitors(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/export/visitors`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error('خطا در دریافت فایل Excel');
    }
    const data = await response.json();
    if (data.url) {
      window.open(data.url, '_blank');
    }
    return data;
  }

  async exportUsers(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/export/users`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error('خطا در دریافت فایل Excel');
    }
    const data = await response.json();
    if (data.url) {
      window.open(data.url, '_blank');
    }
    return data;
  }

  async exportLicenses(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/admin/export/licenses`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });
    if (!response.ok) {
      throw new Error('خطا در دریافت فایل Excel');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true };
  }

  // ==================== Web Admin Management ====================
  // Note: These endpoints may not exist in backend yet
  async getWebAdmins(params: {
    page?: number;
    per_page?: number;
    role?: string;
    status?: string;
  } = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);

      return await this.makeRequest(`${API_BASE_URL}/admin/web-admins?${queryParams}`, {
        method: 'GET',
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404), return empty response instead of throwing
      if (error?.statusCode === 404 || error?.message?.includes('404') || error?.message?.includes('خطا در دریافت')) {
        return { data: { admins: [], total: 0 }, admins: [], total: 0 };
      }
      throw error;
    }
  }

  async getWebAdmin(id: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/web-admins/${id}`, {
      method: 'GET',
    });
  }

  async createWebAdmin(data: any): Promise<any> {
    try {
      return await this.makeRequest(`${API_BASE_URL}/admin/web-admins`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404), throw meaningful error
      if (error?.message?.includes('404') || error?.message?.includes('خطا در دریافت')) {
        throw new Error('Endpoint مدیریت مدیران وب در بک‌اند پیاده‌سازی نشده است. لطفا با تیم توسعه تماس بگیرید.');
      }
      throw error;
    }
  }

  async updateWebAdmin(id: number, data: any): Promise<any> {
    try {
      return await this.makeRequest(`${API_BASE_URL}/admin/web-admins/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404), throw meaningful error
      if (error?.message?.includes('404') || error?.message?.includes('خطا در دریافت')) {
        throw new Error('Endpoint مدیریت مدیران وب در بک‌اند پیاده‌سازی نشده است. لطفا با تیم توسعه تماس بگیرید.');
      }
      throw error;
    }
  }

  async deleteWebAdmin(id: number): Promise<any> {
    try {
      return await this.makeRequest(`${API_BASE_URL}/admin/web-admins/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404), throw meaningful error
      if (error?.message?.includes('404') || error?.message?.includes('خطا در دریافت')) {
        throw new Error('Endpoint مدیریت مدیران وب در بک‌اند پیاده‌سازی نشده است. لطفا با تیم توسعه تماس بگیرید.');
      }
      throw error;
    }
  }

  // ==================== Telegram Admin Management ====================
  async getTelegramAdmins(): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/telegram-admins`, {
      method: 'GET',
    });
  }

  async addTelegramAdmin(data: {
    telegram_id: number;
    first_name: string;
    username?: string;
    is_full_admin: boolean;
    notes?: string;
  }): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/telegram-admins`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTelegramAdmin(telegramId: number): Promise<any> {
    return this.makeRequest(`${API_BASE_URL}/admin/telegram-admins/${telegramId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Bulk Import ====================
  async importSuppliers(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest(`${API_BASE_URL}/admin/import/suppliers`, {
      method: 'POST',
      body: formData,
    });
  }

  async importVisitors(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest(`${API_BASE_URL}/admin/import/visitors`, {
      method: 'POST',
      body: formData,
    });
  }

  async importProducts(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.makeRequest(`${API_BASE_URL}/admin/import/products`, {
      method: 'POST',
      body: formData,
    });
  }
}

export const adminApi = new AdminApiService();

