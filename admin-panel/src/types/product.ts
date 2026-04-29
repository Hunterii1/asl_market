export type AdminProductStatus = 'active' | 'pending' | 'inactive' | 'out_of_stock';

export interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: AdminProductStatus;
  tags?: string[];
  imageUrl?: string;
  discount?: number;
  sku?: string;
  createdAt: string;
  sales?: number;
  revenue?: number;
}

