export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin' | 'supplier' | 'visitor';
  isVerified: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  images: string[];
  specifications: Record<string, any>;
  supplier?: Supplier;
  isAvailable: boolean;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  products: string[];
  isVerified: boolean;
  rating: number;
  contactsUsedToday: number;
  maxDailyContacts: number;
}

export interface Visitor {
  id: string;
  name: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  passportNumber: string;
  address: string;
  isVerified: boolean;
  languages: string[];
}

export interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  sourceCountry: string;
  status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected';
  bankAccount?: string;
  receipt?: string;
  userBankCard?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingCalculation {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  destination: string;
  deliveryTime: string;
  cost: number;
}

export interface AvailableItem {
  id: string;
  product: Product;
  quantity: number;
  condition: 'new' | 'sample' | 'used';
  location: string;
  ownerId: string;
  isForSale: boolean;
  affiliateCommission: number;
}