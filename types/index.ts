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

export type WeekDay =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export type DayHours = {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
};

export type Availability = {
  workingHours: Record<WeekDay, DayHours>;
};

export const WORKING_HOURS_DEFAULTS: Availability = {
  workingHours: {
    monday:    { enabled: true,  start: '09:00', end: '22:00' },
    tuesday:   { enabled: true,  start: '09:00', end: '22:00' },
    wednesday: { enabled: true,  start: '09:00', end: '22:00' },
    thursday:  { enabled: true,  start: '09:00', end: '22:00' },
    friday:    { enabled: true,  start: '09:00', end: '22:00' },
    saturday:  { enabled: false, start: '10:00', end: '14:00' },
    sunday:    { enabled: false, start: '10:00', end: '14:00' },
  },
};

export type AppSettings = {
  business_name: string;
  business_short: string;
  site_email: string | null;
  support_phone: string | null;
  notify_whatsapp_numbers: string[];
  notify_on_new_order: boolean;
  notify_on_order_update: boolean; // 🆕
  order_auto_confirm: boolean;
  accept_cash: boolean;
  accept_card: boolean;
  address: string | null;
  availability: Availability;
  availability_days_label: string;
  availability_label_with_hours: string;
  is_open_now: boolean;
  hours_today: { "enabled": boolean, "start": string, "end": string }
};

export const SETTINGS_DEFAULTS: AppSettings = {
  business_name: '',
  business_short: '',
  site_email: null,
  support_phone: null,
  notify_whatsapp_numbers: [],
  notify_on_new_order: true,
  notify_on_order_update: true, // 🆕
  order_auto_confirm: false,
  accept_cash: true,
  accept_card: true,
  address: null,
  availability: WORKING_HOURS_DEFAULTS,
  availability_days_label: '',
  availability_label_with_hours: '',
  is_open_now: false,
  hours_today: { enabled: false, start: '09:00', end: '22:00' }
};
