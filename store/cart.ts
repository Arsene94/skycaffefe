'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';
import { calculateDiscount, getActiveOffers } from '@/data/offers';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  discount: number;
  total: number;
  deliveryFee: number;
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  
  // Computed
  itemCount: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      subtotal: 0,
      discount: 0,
      total: 0,
      deliveryFee: 10,
      itemCount: 0,

      addItem: (product: Product) => {
        const { items } = get();
        const existingItem = items.find(item => item.product.id === product.id);

        let newItems: CartItem[];
        if (existingItem) {
          newItems = items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newItems = [...items, { product, quantity: 1 }];
        }

        const subtotal = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const discount = calculateDiscount(newItems, getActiveOffers());
        const total = subtotal - discount + get().deliveryFee;
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({
          items: newItems,
          subtotal,
          discount,
          total: Math.max(0, total),
          itemCount,
        });
      },

      removeItem: (productId: string) => {
        const { items } = get();
        const newItems = items.filter(item => item.product.id !== productId);
        
        const subtotal = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const discount = calculateDiscount(newItems, getActiveOffers());
        const total = subtotal - discount + (newItems.length > 0 ? get().deliveryFee : 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({
          items: newItems,
          subtotal,
          discount,
          total: Math.max(0, total),
          itemCount,
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const { items } = get();
        const newItems = items.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );

        const subtotal = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const discount = calculateDiscount(newItems, getActiveOffers());
        const total = subtotal - discount + get().deliveryFee;
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({
          items: newItems,
          subtotal,
          discount,
          total: Math.max(0, total),
          itemCount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
        });
      },

      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      closeCart: () => set({ isOpen: false }),
      openCart: () => set({ isOpen: true }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        discount: state.discount,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
);