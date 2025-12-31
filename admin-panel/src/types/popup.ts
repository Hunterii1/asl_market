// Popup interface matching backend MarketingPopup model
export interface Popup {
  id: number;
  title: string;
  message: string;
  discount_url?: string;
  button_text?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  priority: number;
  show_count: number;
  click_count: number;
  added_by?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}
