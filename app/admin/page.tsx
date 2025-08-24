'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  TrendingUp, ShoppingCart, Users, Star, Eye, Package, Gift, Pencil, Loader2, Trash2, Plus, Minus,
} from 'lucide-react';
import { formatPrice, formatShortDate } from '@/lib/format';
import type { Product } from '@/types';
import apiClient from '@/lib/api';
import Can from '@/components/admin/Can';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  preparing: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  out_for_delivery: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  canceled: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'În așteptare',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  out_for_delivery: 'În livrare',
  completed: 'Finalizată',
  canceled: 'Anulată',
};

type PopularProduct = {
  id: string | number;
  name: string;
  price: number;
  orders: number;
  revenue?: number;
  recommended?: boolean;
};

type OrderLite = any;

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderLite[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[] | null>(null);
  const [popularLoading, setPopularLoading] = useState<boolean>(true);

  // editor
  const [editOpen, setEditOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await apiClient.getOrders({ page: 1, pageSize: 5 });
      setRecentOrders(response?.data ?? []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchRecentOrders, 30000);
    fetchRecentOrders();
    return () => clearInterval(interval);
  }, [fetchRecentOrders]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.getProducts({ page: 1, pageSize: 1000 });
        setProducts(response?.data ?? []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        setPopularLoading(true);
        const res = await apiClient.getPopularProducts({ limit: 5, days: 30 });
        const list: PopularProduct[] = (res?.data ?? res ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price ?? 0),
          orders: Number(p.orders ?? p.total_orders ?? 0),
          revenue: p.revenue != null ? Number(p.revenue) : undefined,
          recommended: !!(p.recommended ?? p.is_recommended),
        }));
        setPopularProducts(list);
      } catch (e) {
        console.warn('Popular products endpoint missing or error. Falling back.', e);
        if (products && products.length > 0) {
          const fallback = products
              .filter(p => (p as any).recommended)
              .slice(0, 5)
              .map((p, idx) => ({
                id: (p as any).id,
                name: (p as any).name,
                price: Number((p as any).price ?? 0),
                orders: 50 - idx * 5,
                recommended: true,
              }));
          setPopularProducts(fallback);
        } else {
          setPopularProducts([]);
        }
      } finally {
        setPopularLoading(false);
      }
    };
    fetchPopular();
  }, [products]);

  const displayPopular = useMemo(() => popularProducts ?? [], [popularProducts]);

  if (!products) return <div className="p-4 sm:p-6">Loading...</div>;

  const DEFAULT_STATUS_CLASS = 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  const DEFAULT_STATUS_LABEL = 'În așteptare';
  const getStatusClass = (status: string) => statusColors[status as OrderStatus] ?? DEFAULT_STATUS_CLASS;
  const getStatusLabel = (status: string) => statusLabels[status as OrderStatus] ?? DEFAULT_STATUS_LABEL;

  const stats = [
    { title: 'Venituri totale', value: '15,247 lei', change: '+12.5%', changeType: 'positive' as const, icon: TrendingUp },
    { title: 'Comenzi totale', value: '432', change: '+8.2%', changeType: 'positive' as const, icon: ShoppingCart },
    { title: 'Clienți unici', value: '287', change: '+15.3%', changeType: 'positive' as const, icon: Users },
    { title: 'Produse active', value: products.length.toString(), change: '+2', changeType: 'positive' as const, icon: Package },
  ];

  const openEditor = (orderId: string | number) => {
    setEditingOrderId(orderId);
    setEditOpen(true);
  };

  const onStatusChanged = (id: string | number, newStatus: OrderStatus) => {
    setRecentOrders(prev =>
        prev.map(o => (String(o.id) === String(id) ? { ...o, status: newStatus } : o))
    );
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Bun venit în panoul de administrare Sky Caffe
          </p>
        </div>

        {/* Stats Cards (ADMIN) */}
        <Can role="ADMIN">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                  <Card key={index}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.title}</p>
                          <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                          <p className={`text-xs sm:text-sm mt-1 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change} vs luna trecută
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[hsl(var(--primary))]/10 rounded-lg flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--primary))]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        </Can>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg md:text-xl">Comenzi recente</CardTitle>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href="/admin/comenzi">
                  <Eye className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Vezi toate</span>
                  <span className="sm:hidden">Toate</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {/* scroll-x pentru mobile */}
              <div className="-mx-4 md:mx-0">
                <div className="overflow-x-auto px-4 md:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comandă</TableHead>
                        <TableHead className="hidden sm:table-cell">Client</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Acțiuni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentOrders ?? []).map((order: any) => (
                          <TableRow key={order.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="min-w-[120px]">
                                <p>#{order.id}</p>
                                <p className="text-xs text-muted-foreground">{formatShortDate(order.created_at || order.createdAt)}</p>
                              </div>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              <div className="min-w-[140px]">
                                <p className="truncate max-w-[160px]">{order.customer ?? order.customer_name ?? '-'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(order.items?.length ?? order.items ?? 0)} {(order.items?.length ?? order.items ?? 0) === 1 ? 'produs' : 'produse'}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="font-semibold whitespace-nowrap">
                              {formatPrice(order.total ?? 0)}
                            </TableCell>

                            {/* pe mobil arătăm statusul ca badge mic în coloana de acțiuni */}
                            <TableCell className="hidden md:table-cell">
                              <InlineStatusEditor
                                  id={order.id}
                                  status={order.status ?? 'pending'}
                                  getStatusClass={getStatusClass}
                                  getStatusLabel={getStatusLabel}
                                  onChanged={(st) => {
                                    onStatusChanged(order.id, st);
                                    fetchRecentOrders();
                                  }}
                              />
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                            <span className="md:hidden text-[10px] px-2 py-1 rounded-full whitespace-nowrap border" aria-hidden>
                              {getStatusLabel(order.status ?? 'pending')}
                            </span>
                                <Button variant="ghost" size="sm" onClick={() => openEditor(order.id)}>
                                  <Pencil className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Editează</span>
                                  <span className="sm:hidden">Edit</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      ))}

                      {(!recentOrders || recentOrders.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                              Nu există comenzi recente.
                            </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg md:text-xl">Produse populare</CardTitle>
            </CardHeader>
            <CardContent>
              {popularLoading ? (
                  <div className="text-sm text-muted-foreground py-4">Se încarcă...</div>
              ) : displayPopular.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">Nu există date pentru produse populare.</div>
              ) : (
                  <div className="space-y-4">
                    {displayPopular.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                            <span className="text-xs sm:text-sm font-bold text-[hsl(var(--primary))]">#{index + 1}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {product.orders} comenzi
                                {typeof product.revenue === 'number' && <> • venit {formatPrice(product.revenue)}</>}
                              </p>
                              {product.recommended && (
                                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Recomandat
                                  </Badge>
                              )}
                            </div>
                          </div>

                          <p className="font-semibold text-[hsl(var(--primary))] whitespace-nowrap">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                    ))}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Acțiuni rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Button asChild variant="outline" className="h-16 sm:h-20 flex-col">
                <Link href="/admin/produse">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm">Adaugă produs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 sm:h-20 flex-col">
                <Link href="/admin/oferte">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm">Creează ofertă</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 sm:h-20 flex-col">
                <Link href="/admin/recomandate">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm">Setează recomandate</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 sm:h-20 flex-col">
                <Link href="/meniu">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm">Vizualizează site</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {editingOrderId && (
            <OrderEditDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                orderId={editingOrderId}
                onSaved={() => {
                  fetchRecentOrders();
                }}
                getStatusClass={getStatusClass}
                getStatusLabel={getStatusLabel}
            />
        )}
      </div>
  );
}

/* =========================
   InlineStatusEditor
   ========================= */
function InlineStatusEditor({
                              id,
                              status,
                              getStatusClass,
                              getStatusLabel,
                              onChanged,
                            }: {
  id: string | number;
  status: OrderStatus;
  getStatusClass: (s: string) => string;
  getStatusLabel: (s: string) => string;
  onChanged?: (s: OrderStatus) => void;
}) {
  const [value, setValue] = useState<OrderStatus>(status);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(status), [status]);

  const save = async (newStatus: OrderStatus) => {
    try {
      setSaving(true);
      await apiClient.updateOrderStatus(id, newStatus);
      toast.success('Status actualizat');
      setValue(newStatus);
      onChanged?.(newStatus);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Eroare la actualizarea statusului');
    } finally {
      setSaving(false);
    }
  };

  return (
      <Select
          value={value}
          onValueChange={(v) => save(v as OrderStatus)}
          disabled={saving}
      >
        <SelectTrigger className="w-[170px]">
          <div className={`w-full text-left ${getStatusClass(value)} rounded px-2 py-1 text-xs font-medium`}>
            {saving ? 'Se salvează...' : getStatusLabel(value)}
          </div>
        </SelectTrigger>
        <SelectContent>
          {(['pending','confirmed','preparing','out_for_delivery','completed','canceled'] as OrderStatus[]).map(st => (
              <SelectItem key={st} value={st}>
                {getStatusLabel(st)}
              </SelectItem>
          ))}
        </SelectContent>
      </Select>
  );
}

/* =========================
   OrderEditDialog
   ========================= */

type ProductLite = { id: number | string; name: string; price: number };

function OrderEditDialog({
                           open,
                           onOpenChange,
                           orderId,
                           onSaved,
                           getStatusLabel,
                         }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | number;
  onSaved?: () => void;
  getStatusClass: (s: string) => string;
  getStatusLabel: (s: string) => string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any | null>(null);

  // form state
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [deliveryType, setDeliveryType] = useState<'delivery'|'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'>('cash');
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  // items
  const [items, setItems] = useState<{ product: ProductLite; quantity: number }[]>([]);

  // products search
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProductLite[]>([]);

  // offers
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const o = await apiClient.getOrder(orderId);
        const data = o?.data ?? o;

        setOrder(data);
        setStatus((data.status ?? 'pending') as OrderStatus);
        setDeliveryType((data.delivery_type ?? 'delivery') as 'delivery'|'pickup');
        setPaymentMethod((data.payment_method ?? 'cash') as 'cash'|'card');
        setNotes(data.notes ?? '');
        setDeliveryFee(Number(data.delivery_fee ?? 0));

        const its = (data.items ?? []).map((it: any) => ({
          product: {
            id: it.product_id ?? it.product?.id,
            name: it.product?.name ?? it.name ?? `Produs #${it.product_id}`,
            price: Number(it.price ?? it.product?.price ?? 0),
          },
          quantity: Number(it.quantity ?? 1),
        }));
        setItems(its);

        try {
          const res = await apiClient.getOffers();
          const list = Array.isArray(res) ? res : res?.data ?? [];
          setOffers(list);
        } catch { setOffers([]); }
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Eroare la încărcarea comenzii');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, orderId]);

  useEffect(() => {
    if (!open || !debounced) {
      setResults([]);
      return;
    }
    (async () => {
      try {
        setSearching(true);
        const res = await apiClient.searchProducts({ q: debounced, pageSize: 10 });
        const list: ProductLite[] = (res?.data ?? res ?? []).map((p: any) => ({
          id: p.id, name: p.name, price: Number(p.price ?? 0),
        }));
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    })();
  }, [open, debounced]);

  const addProduct = (p: ProductLite) => {
    setItems(prev => {
      const idx = prev.findIndex(i => String(i.product.id) === String(p.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    setQ('');
    setResults([]);
  };
  const inc = (id: string | number) => setItems(prev => prev.map(i => String(i.product.id) === String(id) ? { ...i, quantity: i.quantity + 1 } : i));
  const dec = (id: string | number) => setItems(prev => prev.map(i => {
    if (String(i.product.id) !== String(id)) return i;
    const q = Math.max(1, i.quantity - 1);
    return { ...i, quantity: q };
  }));
  const removeItem = (id: string | number) => setItems(prev => prev.filter(i => String(i.product.id) !== String(id)));

  type OfferDTO = {
    id: number;
    code: string;
    name: string;
    type: 'PERCENT' | 'FIXED' | 'BXGY';
    value: number;
    application_type: 'cart' | 'category' | 'product_ids';
    category_id?: string | number | null;
    product_ids?: (string | number)[];
    conditions?: { minItems?: number; minSubtotal?: number; bxgy?: { buy: number; get: number; limit?: number | null } } | null;
    stackable: boolean;
    priority: number;
    active: boolean;
    isActiveNow?: boolean;
  };

  const eligibleItemsForOffer = useCallback((cartItems: { product: ProductLite; quantity: number }[], offer: OfferDTO) => {
    const isEligible = (ci: { product: ProductLite; quantity: number }) => {
      switch (offer.application_type) {
        case 'cart':
          return true;
        case 'category':
          return offer.category_id ? false : false;
        case 'product_ids': {
          const set = new Set((offer.product_ids || []).map(String));
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
    eligibleCartItems.forEach(i => { for (let k = 0; k < i.quantity; k++) unitPrices.push(i.product.price); });
    unitPrices.sort((a, b) => a - b);
    return { eligibleCartItems, qty, subtotal, unitPrices };
  }, []);

  const calcOfferDiscount = useCallback((cartItems: { product: ProductLite; quantity: number }[], offer: OfferDTO): number => {
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
  }, [eligibleItemsForOffer]);

  const calculateDiscount = useCallback((cartItems: { product: ProductLite; quantity: number }[], offersRaw: any[]) => {
    const parsed: OfferDTO[] = (offersRaw ?? []).map((o: any) => ({
      id: Number(o.id),
      code: String(o.code ?? ''),
      name: String(o.name ?? ''),
      type: o.type,
      value: Number(o.value ?? 0),
      application_type: (o.applicationType ?? o.application_type) as any,
      category_id: o.categoryId ?? o.category_id ?? null,
      product_ids: o.productIds ?? o.product_ids ?? [],
      conditions: o.conditions ?? null,
      stackable: Boolean(o.stackable),
      priority: Number(o.priority ?? 0),
      active: Boolean(o.active),
      isActiveNow: o.isActiveNow ?? true,
    }));
    const sorted = parsed.filter(o => o.active && o.isActiveNow !== false).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
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
  }, [calcOfferDiscount]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.product.price * i.quantity, 0), [items]);
  const discount = useMemo(() => calculateDiscount(items, offers), [calculateDiscount, items, offers]);
  const total = Math.max(0, subtotal - discount + (deliveryType === 'delivery' ? deliveryFee : 0));

  const save = async () => {
    try {
      setSaving(true);
      if (order && status !== order.status) {
        await apiClient.updateOrderStatus(orderId, status);
      }
      await apiClient.updateOrder(orderId, {
        items: items.map(i => ({ product_id: Number(i.product.id), quantity: i.quantity })),
        notes: notes || null,
        payment_method: paymentMethod,
        delivery_type: deliveryType,
      });
      toast.success('Comandă actualizată');
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('Sigur anulezi comanda?')) return;
    try {
      await apiClient.cancelOrder(orderId);
      toast.success('Comandă anulată');
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Eroare la anulare');
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl">
          <DialogHeader><DialogTitle>Editează comanda #{orderId}</DialogTitle></DialogHeader>

          {loading ? (
              <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
              </div>
          ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                {/* Stânga */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1 md:col-span-1">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                        <SelectTrigger><SelectValue placeholder="Alege status" /></SelectTrigger>
                        <SelectContent>
                          {(['pending','confirmed','preparing','out_for_delivery','completed','canceled'] as OrderStatus[]).map(st => (
                              <SelectItem key={st} value={st}>{getStatusLabel(st)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label>Livrare</Label>
                      <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delivery">Livrare</SelectItem>
                          <SelectItem value="pickup">Ridicare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label>Plată</Label>
                      <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Numerar</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Observații</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucțiuni..." />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Produse</Label>
                    <div>
                      <Input placeholder="Caută produs..." value={q} onChange={(e) => setQ(e.target.value)} />
                      {q && (
                          <div className="mt-2 max-h-44 overflow-y-auto border rounded-md">
                            {searching && <div className="p-3 text-sm text-muted-foreground">Se caută...</div>}
                            {!searching && results.length === 0 && <div className="p-3 text-sm text-muted-foreground">Niciun produs</div>}
                            {results.map(p => (
                                <button
                                    key={String(p.id)}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between"
                                    onClick={() => addProduct(p)}
                                >
                                  <span className="truncate">{p.name}</span>
                                  <span className="text-sm text-muted-foreground">{formatPrice(p.price)}</span>
                                </button>
                            ))}
                          </div>
                      )}
                    </div>

                    {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map(it => (
                              <div key={String(it.product.id)} className="flex items-center justify-between border rounded-md px-3 py-2 gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium truncate">{it.product.name}</div>
                                  <div className="text-xs text-muted-foreground">{formatPrice(it.product.price)} / buc</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="icon" onClick={() => dec(it.product.id)}><Minus className="w-3 h-3" /></Button>
                                  <div className="w-8 text-center font-medium">{it.quantity}</div>
                                  <Button variant="outline" size="icon" onClick={() => inc(it.product.id)}><Plus className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => removeItem(it.product.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                          ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Adaugă produse în comandă.</div>
                    )}
                  </div>
                </div>

                {/* Dreapta: sumar */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Sumar</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span className={discount > 0 ? 'text-green-600 font-medium' : ''}>
                      - {formatPrice(discount)}
                    </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Livrare</span>
                        <span>
                      {deliveryType === 'pickup' ? 'Gratuit' : formatPrice(deliveryFee)}
                    </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(total)}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-3">
                        <Button className="flex-1" onClick={save} disabled={saving}>
                          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se salvează</> : 'Salvează'}
                        </Button>
                        <Button className="flex-1" variant="destructive" onClick={cancelOrder}>
                          Anulează comanda
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
  );
}
