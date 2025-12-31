export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'matching';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  is_read: boolean;
  user_id: number | null; // null = broadcast to all users
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_by_id: number;
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  expires_at: string | null;
  action_url: string;
  action_text: string;
  created_at: string;
  updated_at: string;
}
