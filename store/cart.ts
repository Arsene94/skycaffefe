// store/cart.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';
import type { Product, CartItem } from '@/types';

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

// ✅ tip mic pentru zona salvată în store
type DeliveryZoneSlim = {
  id: number | string;
  name: string;
  deliveryFee: number;
  minOrder: number;
};

// -------- eligibilitate ----------
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

  const unitPrices: number[] = [];
  eligibleCartItems.forEach((i) => {
    for (let k = 0; k < i.quantity; k++) unitPrices.push(i.product.price);
  });
  unitPrices.sort((a, b) => a - b);

  return { eligibleCartItems, qty, subtotal, unitPrices };
}

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

// ---------- Discount per ofertă ----------
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

// ---------- Sumă discount total (respectă stacking) ----------
function calculateDiscount(cartItems: CartItem[], offers: OfferDTO[]): number {
  if (!offers?.length) return 0;
  const sorted = [...offers]
      .filter(o => o.active && o.isActiveNow !== false)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  let totalDiscount = 0;
  let nonStackApplied = false;

  for (const offer of sorted) {
    const d = calcOfferDiscount(cartItems, offer);
    if (!offer.stackable) {
      if (!nonStackApplied && d > 0) {
        totalDiscount += d;
        nonStackApplied = true;
      }
    } else if (d > 0) {
      totalDiscount += d;
    }
  }
  return totalDiscount;
}

// ---------- Ofertă aplicată: pentru mesaje UI ----------
type AppliedOffer = { code: string; name: string; amount: number; type: OfferType };

function calculateAppliedOffers(cartItems: CartItem[], offers: OfferDTO[]): AppliedOffer[] {
  if (!offers?.length) return [];
  const sorted = [...offers]
      .filter(o => o.active && o.isActiveNow !== false)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const applied: AppliedOffer[] = [];
  let nonStackApplied = false;

  for (const offer of sorted) {
    const d = calcOfferDiscount(cartItems, offer);
    if (d <= 0) continue;

    if (!offer.stackable) {
      if (!nonStackApplied) {
        applied.push({ code: offer.code, name: offer.name, amount: d, type: offer.type });
        nonStackApplied = true;
      }
    } else {
      applied.push({ code: offer.code, name: offer.name, amount: d, type: offer.type });
    }
  }
  return applied;
}

// ---------- Hints ----------
type OfferHint = {
  code: string;
  message: string;
  missingCount?: number;
  missingAmount?: number;
  suggestedProduct?: { id: string | number; name: string };
  success?: boolean;
};
function pluralProd(n: number) { return n === 1 ? 'produs' : 'produse'; }
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
  const suggested = pickCheapestEligibleProduct(eligibleCartItems);

  // Dacă deja se aplică discount pentru această ofertă, afișăm mesaj de succes
  const dNow = calcOfferDiscount(cartItems, offer);
  if (dNow > 0) {
    // Notă: nu știm aici dacă a fost „tăiată” de o ofertă non-stack aplicată anterior.
    // Mesajul final „aplicat” îl afișăm în Header din getAppliedOffers().
    if (offer.type === 'BXGY') {
      const bxgy = offer.conditions?.bxgy;
      return {
        code: offer.code,
        message: `Felicitări! Ai beneficiat de oferta ${offer.name}${bxgy ? ` (${bxgy.buy}+${bxgy.get})` : ''}.`,
        success: true,
      };
    }
    // pentru PERCENT/FIXED: mesaj prietenos
    return {
      code: offer.code,
      message: `Reducerea ${offer.name} este eligibilă pentru coșul tău.`,
      success: true,
    };
  }

  // altfel, ajutăm clientul cum să „atingă” oferta
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

  if (offer.type === 'BXGY') {
    const bxgy = offer.conditions?.bxgy;
    if (!bxgy) return null;

    const block = bxgy.buy + bxgy.get;
    if (qty < block) {
      const missing = block - qty;
      return {
        code: offer.code,
        missingCount: missing,
        suggestedProduct: suggested || undefined,
        message: `Mai adaugă ${missing} ${pluralProd(missing)}${suggested ? ` (ex: ${suggested.name})` : ''} în ${scopeLabel(offer)} pentru a primi ${bxgy.get} gratis.`,
      };
    }
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
  }

  return null;
}

// ---- Store ----
interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  subtotal: number;
  discount: number;
  total: number;

  // ✅ livrare
  deliveryType: 'delivery' | 'pickup';
  deliveryZone: DeliveryZoneSlim | null;

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

  // ✅ mesaje/aplicate
  getAppliedOffers: () => AppliedOffer[];

  // ✅ acțiuni livrare
  setDeliveryType: (type: 'delivery' | 'pickup') => void;
  setDeliveryZone: (zone: DeliveryZoneSlim | null) => void;
  clearDeliveryZone: () => void;
}

type CartPersist = Pick<
    CartStore,
    'items' | 'subtotal' | 'discount' | 'total' | 'itemCount' | 'deliveryType' | 'deliveryZone'
>;

export const useCartStore = create<CartStore>()(
    persist<CartStore, [], [], CartPersist>(
        (set, get) => {
          const recalcTotals = (items: CartItem[]) => {
            const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
            const discount = calculateDiscount(items, get().offers);
            const shouldChargeDelivery = items.length > 0 && get().deliveryType === 'delivery';
            const fee = shouldChargeDelivery ? (get().deliveryZone?.deliveryFee ?? 0) : 0;
            const total = Math.max(0, subtotal - discount + fee);
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

            // ✅ init livrare
            deliveryType: 'delivery',
            deliveryZone: null,

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
                  const shouldChargeDelivery = items.length > 0 && get().deliveryType === 'delivery';
                  const fee = shouldChargeDelivery ? (get().deliveryZone?.deliveryFee ?? 0) : 0;
                  const total = Math.max(0, subtotal - discount + fee);
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

            // ✅ oferte aplicate (pentru mesaj clar în UI)
            getAppliedOffers: () => {
              const items = get().items;
              return calculateAppliedOffers(items, get().offers);
            },

            // ✅ livrare
            setDeliveryType: (type) => {
              set({ deliveryType: type });
              // recalc total cu noul tip
              const items = get().items;
              const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
              const discount = calculateDiscount(items, get().offers);
              const fee = items.length > 0 && type === 'delivery' ? (get().deliveryZone?.deliveryFee ?? 0) : 0;
              const total = Math.max(0, subtotal - discount + fee);
              const itemCount = items.reduce((s, i) => s + i.quantity, 0);
              set({ subtotal, discount, total, itemCount });
            },

            setDeliveryZone: (zone) => {
              set({ deliveryZone: zone });
              // recalc
              const items = get().items;
              const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
              const discount = calculateDiscount(items, get().offers);
              const fee = items.length > 0 && get().deliveryType === 'delivery' ? (zone?.deliveryFee ?? 0) : 0;
              const total = Math.max(0, subtotal - discount + fee);
              const itemCount = items.reduce((s, i) => s + i.quantity, 0);
              set({ subtotal, discount, total, itemCount });
            },

            clearDeliveryZone: () => {
              set({ deliveryZone: null });
              // recalc
              const items = get().items;
              const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
              const discount = calculateDiscount(items, get().offers);
              const fee = items.length > 0 && get().deliveryType === 'delivery' ? 0 : 0;
              const total = Math.max(0, subtotal - discount + fee);
              const itemCount = items.reduce((s, i) => s + i.quantity, 0);
              set({ subtotal, discount, total, itemCount });
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
            // ✅ persistăm tipul și zona selectată
            deliveryType: s.deliveryType,
            deliveryZone: s.deliveryZone,
          }),
        }
    )
);
