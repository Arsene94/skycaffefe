export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_type: string;
  image: string;
  category: Category;
  tags: Tags[];
  recommended: boolean;
  available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Tags {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
  is_popular: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  applicationType: 'cart' | 'category' | 'productIds';
  categoryId?: string;
  productIds?: string[];
  conditions: {
    minItems?: number;
    minSubtotal?: number;
    startDate?: Date;
    endDate?: Date;
  };
  stackable: boolean;
  priority: number;
  active: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
  paymentMethod: 'cash' | 'card';
  deliveryType: 'delivery' | 'pickup';
  subtotal: number;
  discount: number;
  total: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered';
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  popularProducts: { product: Product; orders: number }[];
  recentOrders: Order[];
}
