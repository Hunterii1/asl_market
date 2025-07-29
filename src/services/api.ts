import { getErrorMessage, translateSuccess } from '@/utils/errorMessages';
import { toast } from '@/hooks/use-toast';

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

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    console.log('🔑 Token from localStorage:', token ? 'exists' : 'missing');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch' }));
      const errorMessage = getErrorMessage(error.error || error.message || 'Request failed');
      
      // Show Persian error toast
      toast({
        variant: "destructive",
        title: "خطا",
        description: errorMessage,
        duration: 5000,
      });
      
      throw new Error(errorMessage);
    }
    return response.json();
  }

  private showSuccessToast(message: string) {
    const persianMessage = translateSuccess(message);
    toast({
      title: "موفقیت",
      description: persianMessage,
      duration: 3000,
    });
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
      console.log('💾 Storing login token:', data.data.token.substring(0, 20) + '...');
      localStorage.setItem('auth_token', data.data.token);
      this.showSuccessToast('Login successful');
    } else {
      console.error('❌ No token in login response:', data);
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
      console.log('💾 Storing register token:', data.data.token.substring(0, 20) + '...');
      localStorage.setItem('auth_token', data.data.token);
      this.showSuccessToast('Registration successful');
    } else {
      console.error('❌ No token in register response:', data);
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

  // AI Chat methods
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    return this.handleResponse(response);
  }

  async getChats(): Promise<ChatsResponse> {
    const response = await fetch(`${API_BASE_URL}/ai/chats`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async getChat(chatId: number): Promise<{ chat: Chat }> {
    const response = await fetch(`${API_BASE_URL}/ai/chats/${chatId}`, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    return this.handleResponse(response);
  }

  async deleteChat(chatId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/ai/chats/${chatId}`, {
      method: 'DELETE',
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