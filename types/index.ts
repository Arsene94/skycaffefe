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
  show_delivery: boolean;
  show_menu: boolean;
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
  show_delivery: boolean;
  show_menu: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Offer {
  id: string;                 // usually equals `code`
  numericId?: number;         // numeric DB id (admin use)
  code?: string;              // explicit code if needed
  name: string;
  description?: string | null;
  type: 'PERCENT' | 'FIXED' | 'BXGY';
  value: number;              // BXGY ignores this (keep 0)
  applicationType: 'cart' | 'category' | 'productIds' | 'product_ids';
  categoryId?: string | null;
  productIds?: string[];
  conditions?: {
    minItems?: number;
    minSubtotal?: number;
    startDate?: Date;
    endDate?: Date;
    bxgy?: {
      buy: number;
      get: number;
      limit?: number | null;
    };
  };
  bxgy?: {
    buy: number;
    get: number;
    limit?: number | null;
  };
  stackable: boolean;
  priority: number;
  active: boolean;
  isActiveNow?: boolean;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  category?: {
    id: string;
    name: string;
    slug?: string;
  };

  createdAt?: string;
  updatedAt?: string;
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
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled';
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

export type OfferHint = {
  code: string;
  message: string;
};

export type ClientAddress = {
  id: string;
  address: string;
  city?: string | null;
  isDefault: boolean;
  lastUsed?: string | null;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type Client = {
  id: string;
  name: string;
  phone?: string | null;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string | null;
  lastOrderAt?: Date | null | undefined;
  created_at?: Date | null;
  addresses: ClientAddress[];
};

export type DeliveryZone = {
  id: number | string;
  name: string;
  description?: string | null;
  deliveryFee: number;
  deliveryTime?: string | null;
  minOrder: number;
  active: boolean;
  areas: string[];
  createdAt?: string; // ISO
  updatedAt?: string;
};

export type ViewOrder = {
  id: string;
  createdAt: Date;
  status?: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  items: { product: { id: number | string; name: string; price: number }; quantity: number }[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
};
