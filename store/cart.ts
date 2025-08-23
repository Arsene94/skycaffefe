// store/cart.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';
import type { Product, CartItem } from '@/types';

// ---- Tipuri pentru ofertele din API (normalizate) ----
type OfferType = 'PERCENT' | 'FIXED' | 'BXGY';
type ApplicationType = 'cart' | 'category' | 'product_ids';

type BXGY = { buy: number; get: number; limit?: number | null };

type OfferDTO = {
  id: number;
  numericId: number;
  code: string;
  name: string;
  description?: string | null;
  type: OfferType;
  value: number;
  applicationType: ApplicationType;
  categoryId?: string | null;
  productIds?: string[];
  conditions?: {
    minItems?: number;
    minSubtotal?: number;
    bxgy?: BXGY;
  } | null;
  stackable: boolean;
  priority: number;
  active: boolean;
  isActiveNow?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

// -------- Helpers eligibilitate + preț unitar ----------
function eligibleItemsForOffer(cartItems: CartItem[], offer: OfferDTO) {
  const isEligible = (ci: CartItem) => {
    switch (offer.applicationType) {
      case 'cart':
        return true;
      case 'category':
        return offer.categoryId
            ? String((ci.product as any)?.category?.id) === String(offer.categoryId)
            : false;
      case 'product_ids': {
        const set = new Set((offer.productIds || []).map(String));
        return set.has(String(ci.product.id));
      }
      default:
        return false;
    }
  };

  const eligibleCartItems = cartItems.filter(isEligible);
  const qty = eligibleCartItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal = eligibleCartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  // prețuri unitare (pt BXGY)
  const unitPrices: number[] = [];
  eligibleCartItems.forEach((i) => {
    for (let k = 0; k < i.quantity; k++) unitPrices.push(i.product.price);
  });
  unitPrices.sort((a, b) => a - b);

  return { eligibleCartItems, qty, subtotal, unitPrices };
}

// cel mai ieftin produs eligibil din coș (ca exemplu în mesaj)
function pickCheapestEligibleProduct(eligibleCartItems: CartItem[]) {
  if (!eligibleCartItems.length) return null;
  let best: { price: number; id: string | number; name: string } | null = null;
  for (const ci of eligibleCartItems) {
    const price = ci.product.price;
    if (!best || price < best.price) {
      best = { price, id: ci.product.id as any, name: ci.product.name };
    }
  }
  return best ? { id: best.id, name: best.name } : null;
}

// ---------- Discount ----------
function calcOfferDiscount(cartItems: CartItem[], offer: OfferDTO): number {
  const { qty, subtotal, unitPrices } = eligibleItemsForOffer(cartItems, offer);

  if (offer.conditions?.minSubtotal != null && subtotal < offer.conditions.minSubtotal) return 0;
  if (offer.conditions?.minItems != null && qty < offer.conditions.minItems) return 0;

  switch (offer.type) {
    case 'PERCENT':
      return (subtotal * offer.value) / 100;
    case 'FIXED':
      return Math.min(offer.value, subtotal);
    case 'BXGY': {
      const bxgy = offer.conditions?.bxgy;
      if (!bxgy || qty <= 0) return 0;

      const block = bxgy.buy + bxgy.get;
      const blocks = Math.floor(qty / block);
      if (blocks <= 0) return 0;

      const limitBlocks = bxgy.limit ? Math.min(blocks, bxgy.limit) : blocks;
      const freeUnits = limitBlocks * bxgy.get;
      if (freeUnits <= 0) return 0;

      return unitPrices.slice(0, freeUnits).reduce((s, p) => s + p, 0);
    }
    default:
      return 0;
  }
}

function calculateDiscount(cartItems: CartItem[], offers: OfferDTO[]): number {
  if (!offers?.length) return 0;
  const sorted = [...offers]
      .filter(o => o.active && o.isActiveNow !== false)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  let totalDiscount = 0;
  let nonStackApplied = false;

  for (const offer of sorted) {
    const d = calcOfferDiscount(cartItems, offer);
    if (!offer.stackable && !nonStackApplied && d > 0) {
      totalDiscount += d;
      nonStackApplied = true;
    } else if (offer.stackable && d > 0) {
      totalDiscount += d;
    }
  }
  return totalDiscount;
}

// ---------- Hints ----------
type OfferHint = {
  code: string;
  message: string;
  missingCount?: number;
  missingAmount?: number;
  suggestedProduct?: { id: string | number; name: string }; // ✅
};

function pluralProd(n: number) {
  return n === 1 ? 'produs' : 'produse';
}
function scopeLabel(offer: OfferDTO): string {
  switch (offer.applicationType) {
    case 'cart': return 'coș';
    case 'category': return 'categorie';
    case 'product_ids': return 'produsele selectate';
    default: return 'coș';
  }
}

function computeHintForOffer(cartItems: CartItem[], offer: OfferDTO): OfferHint | null {
  if (!(offer.active && offer.isActiveNow !== false)) return null;

  const { eligibleCartItems, qty, subtotal } = eligibleItemsForOffer(cartItems, offer);
  const suggested = pickCheapestEligibleProduct(eligibleCartItems); // ✅

  // PERCENT / FIXED cu praguri
  if (offer.type === 'PERCENT' || offer.type === 'FIXED') {
    if (offer.conditions?.minItems != null && qty < offer.conditions.minItems) {
      const missing = offer.conditions.minItems - qty;
      return {
        code: offer.code,
        missingCount: missing,
        suggestedProduct: suggested || undefined,
        message: `Mai adaugă ${missing} ${pluralProd(missing)}${suggested ? ` (ex: ${suggested.name})` : ''} în ${scopeLabel(offer)} pentru a beneficia de reducere.`,
      };
    }
    if (offer.conditions?.minSubtotal != null && subtotal < offer.conditions.minSubtotal) {
      const missing = offer.conditions.minSubtotal - subtotal;
      return {
        code: offer.code,
        missingAmount: missing,
        suggestedProduct: suggested || undefined,
        message: `Mai adaugă produse de ${missing.toFixed(2)} lei${suggested ? ` (ex: ${suggested.name})` : ''} în ${scopeLabel(offer)} pentru a beneficia de reducere.`,
      };
    }
    return null;
  }

  // BXGY
  if (offer.type === 'BXGY') {
    const bxgy = offer.conditions?.bxgy;
    if (!bxgy) return null;

    const block = bxgy.buy + bxgy.get;

    // nu are încă primul bloc complet
    if (qty < block) {
      const missing = block - qty;
      return {
        code: offer.code,
        missingCount: missing,
        suggestedProduct: suggested || undefined,
        message: `Mai adaugă ${missing} ${pluralProd(missing)}${suggested ? ` (ex: ${suggested.name})` : ''} în ${scopeLabel(offer)} pentru a primi ${bxgy.get} gratis.`,
      };
    }

    // ghidaj către următorul bloc (dacă nu s-a atins limita)
    if (!bxgy.limit || Math.floor(qty / block) < bxgy.limit) {
      const remainder = qty % block;
      if (remainder !== 0) {
        const missing = block - remainder;
        return {
          code: offer.code,
          missingCount: missing,
          suggestedProduct: suggested || undefined,
          message: `Mai adaugă ${missing} ${pluralProd(missing)}${suggested ? ` (ex: ${suggested.name})` : ''} în ${scopeLabel(offer)} pentru încă ${bxgy.get} gratis.`,
        };
      }
    }

    return null;
  }

  return null;
}

// ---- Store (restul rămâne la fel; doar getOfferHints e deja ok) ----
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  discount: number;
  total: number;
  deliveryFee: number;
  itemCount: number;

  offers: OfferDTO[];
  offersInitialized: boolean;
  offersLoading: boolean;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;

  refreshOffers: () => Promise<void>;

  getOfferHints: () => OfferHint[];
}

type CartPersist = Pick<
    CartStore,
    'items' | 'subtotal' | 'discount' | 'total' | 'itemCount' | 'deliveryFee'
>;

export const useCartStore = create<CartStore>()(
    persist<CartStore, [], [], CartPersist>(
        (set, get) => {
          const recalcTotals = (items: CartItem[]) => {
            const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
            const discount = calculateDiscount(items, get().offers);
            const delivery = items.length > 0 ? get().deliveryFee : 0;
            const total = Math.max(0, subtotal - discount + delivery);
            const itemCount = items.reduce((s, i) => s + i.quantity, 0);
            set({ items, subtotal, discount, total, itemCount });
          };

          const initOffersIfNeeded = async () => {
            const { offersInitialized, offersLoading } = get();
            if (offersInitialized || offersLoading) return;
            await get().refreshOffers();
          };

          return {
            items: [],
            isOpen: false,
            subtotal: 0,
            discount: 0,
            total: 0,
            deliveryFee: 10,
            itemCount: 0,

            offers: [],
            offersInitialized: false,
            offersLoading: false,

            addItem: (product: Product) => {
              const items = get().items;
              const idx = items.findIndex(i => String(i.product.id) === String(product.id));
              const newItems =
                  idx >= 0
                      ? items.map((i, k) => (k === idx ? { ...i, quantity: i.quantity + 1 } : i))
                      : [...items, { product, quantity: 1 }];
              recalcTotals(newItems);
              initOffersIfNeeded();
            },

            removeItem: (productId: string) => {
              const newItems = get().items.filter(i => String(i.product.id) !== String(productId));
              recalcTotals(newItems);
              initOffersIfNeeded();
            },

            updateQuantity: (productId: string, quantity: number) => {
              if (quantity <= 0) {
                const filtered = get().items.filter(i => String(i.product.id) !== String(productId));
                recalcTotals(filtered);
                initOffersIfNeeded();
                return;
              }
              const newItems = get().items.map(i =>
                  String(i.product.id) === String(productId) ? { ...i, quantity } : i
              );
              recalcTotals(newItems);
              initOffersIfNeeded();
            },

            clearCart: () => {
              set({ items: [], subtotal: 0, discount: 0, total: 0, itemCount: 0 });
            },

            toggleCart: () => set(s => ({ isOpen: !s.isOpen })),
            closeCart: () => set({ isOpen: false }),
            openCart: () => set({ isOpen: true }),

            refreshOffers: async () => {
              try {
                set({ offersLoading: true });
                const res = await apiClient.getOffers();
                const list = Array.isArray(res) ? res : res?.data ?? [];
                const offers: OfferDTO[] = list.map((o: any) => ({
                  id: Number(o.id),
                  numericId: Number(o.numericId ?? o.id),
                  code: String(o.code),
                  name: String(o.name),
                  description: o.description ?? null,
                  type: o.type as OfferType,
                  value: Number(o.value ?? 0),
                  applicationType: (o.applicationType ?? o.application_type) as ApplicationType,
                  categoryId: o.categoryId ?? o.category_id ?? null,
                  productIds: o.productIds ?? o.product_ids ?? [],
                  conditions: o.conditions ?? null,
                  stackable: Boolean(o.stackable),
                  priority: Number(o.priority ?? 0),
                  active: Boolean(o.active),
                  isActiveNow: o.isActiveNow ?? true,
                  startsAt: o.startsAt ?? o.starts_at ?? null,
                  endsAt: o.endsAt ?? o.ends_at ?? null,
                }));

                set({ offers, offersInitialized: true, offersLoading: false });

                const items = get().items;
                if (items.length > 0) {
                  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
                  const discount = calculateDiscount(items, offers);
                  const delivery = items.length > 0 ? get().deliveryFee : 0;
                  const total = Math.max(0, subtotal - discount + delivery);
                  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
                  set({ subtotal, discount, total, itemCount });
                }
              } catch (e) {
                console.error('Failed to load offers:', e);
                set({ offersInitialized: true, offersLoading: false });
              }
            },

            getOfferHints: () => {
              const state = get();
              if (!state.offersInitialized && !state.offersLoading) {
                state.refreshOffers().catch(() => {});
                return [];
              }

              const items = state.items;
              const offers = state.offers
                  .filter(o => o.active && o.isActiveNow !== false)
                  .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

              const hints: OfferHint[] = [];
              for (const offer of offers) {
                const h = computeHintForOffer(items, offer);
                if (h) hints.push(h);
              }
              return hints.slice(0, 2);
            },
          };
        },
        {
          name: 'cart-storage',
          partialize: (s): CartPersist => ({
            items: s.items,
            subtotal: s.subtotal,
            discount: s.discount,
            total: s.total,
            itemCount: s.itemCount,
            deliveryFee: s.deliveryFee,
          }),
        }
    )
);
