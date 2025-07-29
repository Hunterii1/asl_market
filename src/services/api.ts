const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
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

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse(response);
    
    // Store token in localStorage
    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
    }
    
    return data.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await this.handleResponse(response);
    
    // Store token in localStorage
    if (data.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
    }
    
    return data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    const data = await this.handleResponse(response);
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

  // Auth helpers
  logout() {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const apiService = new ApiService(); 