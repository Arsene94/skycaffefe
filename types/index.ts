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
  nutritional_values: string;
  ingredients: string;
  allergens: string[];
  weight: number;
  stock_quantity: number;
  stock_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PERMANENT';
  in_stock: boolean;
  active_recommendation: boolean | null;
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

export const EU_ALLERGENS = [
  { id: 'gluten',      label: 'Cereale cu gluten (grâu, secară, orz, ovăz, speltă)' },
  { id: 'crustaceans', label: 'Crustacee' },
  { id: 'eggs',        label: 'Ouă' },
  { id: 'fish',        label: 'Pește' },
  { id: 'peanuts',     label: 'Arahide' },
  { id: 'soybeans',    label: 'Soia' },
  { id: 'milk',        label: 'Lapte' },
  { id: 'nuts',        label: 'Fructe cu coajă (migdale, alune, nuci, fistic etc.)' },
  { id: 'celery',      label: 'Țelină' },
  { id: 'mustard',     label: 'Muștar' },
  { id: 'sesame',      label: 'Susan' },
  { id: 'sulphites',   label: 'Dioxid de sulf și sulfiți' },
  { id: 'lupin',       label: 'Lupin' },
  { id: 'molluscs',    label: 'Moluște' },
];
