'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
    Search,
    Eye,
    Plus,
    Phone,
    Mail,
    MapPin,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Banknote,
    CreditCard,
    PackageSearch,
    ShoppingBag,
} from 'lucide-react';

import apiClient from '@/lib/api';
import {formatDate, formatPrice, formatShortDate, generateOrderId} from '@/lib/format';

/* ===========================
   Tipuri
   =========================== */

type OrderItemLite = {
    id: number | string;
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
};

type OrderLite = {
    id: number | string;
    created_at: string;
    status: string;
    delivery_type: 'delivery' | 'pickup';
    payment_method: 'cash' | 'card';
    delivery_fee: number;
    subtotal: number;
    discount: number;
    total: number;
    customer_name: string;
    customer_phone: string;
    address_text?: string | null;
    user?: { id: number; name: string; email: string | null } | null;
    items: OrderItemLite[];
};

type DeliveryZone = {
    id: number | string;
    name: string;
    deliveryFee: number;
    minOrder: number;
};

type ClientAddress = {
    id: number | string;
    city: string;
    address: string;
    is_default?: boolean;
    label?: string | null;
};

type ProductLite = {
    id: number | string;
    name: string;
    price: number;
    category_id?: number | null;
};

type Offer = {
    id: number;
    code?: string | null;
    name: string;
    description?: string | null;
    type: 'PERCENT' | 'FIXED' | 'BXGY';
    value: number;
    application_type: 'cart' | 'category' | 'product_ids';
    category_id?: number | null;
    products?: { id: number }[];
    conditions?: {
        minItems?: number;
        minSubtotal?: number;
        bxgy?: { buy: number; get: number; limit?: number };
    } | null;
    stackable?: boolean;
    priority?: number;
};

const ORDER_STATUS_LABEL: Record<string, string> = {
    pending: 'În așteptare',
    confirmed: 'Confirmată',
    preparing: 'În pregătire',
    out_for_delivery: 'În livrare',
    completed: 'Finalizată',
    canceled: 'Anulată',
};

/* ===========================
   Pagina Admin Orders
   =========================== */

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    const [createOpen, setCreateOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState<OrderLite | null>(null);

    // debounce
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 400);
        return () => clearTimeout(t);
    }, [search]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getOrders({ page, pageSize: PAGE_SIZE });
            const raw = res?.data ?? [];
            const list: OrderLite[] = raw.map((o: any) => ({
                id: o.id,
                created_at: o.created_at,
                status: o.status,
                delivery_type: o.delivery_type,
                payment_method: o.payment_method,
                delivery_fee: Number(o.delivery_fee ?? 0),
                subtotal: Number(o.subtotal ?? 0),
                discount: Number(o.discount ?? 0),
                total: Number(o.total ?? 0),
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                address_text: o.address_text ?? null,
                user: o.user ?? null,
                items: (o.items ?? []).map((it: any) => ({
                    id: it.id,
                    product_id: Number(it.product_id),
                    product_name: it.product_name,
                    unit_price: Number(it.unit_price ?? 0),
                    quantity: Number(it.quantity ?? 0),
                    line_total: Number(it.line_total ?? 0),
                })),
            }));
            setOrders(list);
            setTotal(res?.total ?? list.length);
            setPage(res?.current_page ?? page);
            setLastPage(res?.last_page ?? 1);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea comenzilor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // reset page on new search
    useEffect(() => {
        setPage(1);
    }, [debounced]);

    // client-side search in pagina curentă
    const filteredOrders = useMemo(() => {
        if (!debounced) return orders;
        const term = debounced.toLowerCase();
        return orders.filter((o) => {
            const inCustomer =
                (o.customer_name || '').toLowerCase().includes(term) ||
                (o.customer_phone || '').toLowerCase().includes(term) ||
                (o.user?.email || '').toLowerCase().includes(term) ||
                (o.user?.name || '').toLowerCase().includes(term);
            const inAddress = (o.address_text || '').toLowerCase().includes(term);
            const inItems = o.items.some((it) => it.product_name.toLowerCase().includes(term));
            const inId = String(o.id).includes(term);
            return inCustomer || inAddress || inItems || inId;
        });
    }, [orders, debounced]);

    const startIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);
    const endIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + orders.length), [page, total, orders.length]);

    const goToPage = (p: number) => {
        const np = Math.max(1, Math.min(lastPage, p));
        if (np !== page) setPage(np);
    };

    const pageButtons = useMemo(() => {
        const maxBtns = 5;
        let start = Math.max(1, page - Math.floor(maxBtns / 2));
        let end = Math.min(lastPage, start + maxBtns - 1);
        if (end - start + 1 < maxBtns) start = Math.max(1, end - maxBtns + 1);
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
    }, [page, lastPage]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Comenzi</h1>
                    <p className="text-muted-foreground">Vezi și gestionează comenzile</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Comandă nouă
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută după nume, email, telefon, produse..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Comenzi ({total})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Se încarcă...</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Comandă</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Produse</TableHead>
                                        <TableHead>Livrare</TableHead>
                                        <TableHead>Plată</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Acțiuni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((o) => (
                                        <TableRow key={o.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-semibold">#{o.id}</div>
                                                    <div className="text-xs text-muted-foreground">{formatShortDate(o.created_at)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{o.customer_name}</div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{o.customer_phone}</span>
                                                    </div>
                                                    {o.user?.email && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate max-w-[180px]">{o.user.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-semibold">{o.items.reduce((s, it) => s + it.quantity, 0)}</span>
                                                        <span className="text-muted-foreground">art.</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                                        {o.items.map((it) => it.product_name).join(', ')}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="font-medium">{o.delivery_type === 'delivery' ? 'Livrare' : 'Ridicare'}</div>
                                                    {o.delivery_type === 'delivery' && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate max-w-[220px]">{o.address_text || '-'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-xs">
                                                    {o.payment_method === 'cash' ? (
                                                        <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> Numerar</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Card</span>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-[hsl(var(--primary))]">
                                                {formatPrice(o.total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-xs">
                                                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => setViewOrder(o)} title="Vezi">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {filteredOrders.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-2">🧾</div>
                                    <p className="text-muted-foreground">Nu s-au găsit comenzi.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {total > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">
                                        Afișează <span className="font-medium">{startIndex}</span>–<span className="font-medium">{endIndex}</span> din <span className="font-medium">{total}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={page <= 1}>
                                            <ChevronsLeft className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {pageButtons[0] > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => goToPage(1)}>1</Button>
                                        )}
                                        {pageButtons[0] > 2 && <span className="px-2 text-muted-foreground">…</span>}

                                        {pageButtons.map((p) => (
                                            <Button
                                                key={p}
                                                variant={p === page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => goToPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        ))}

                                        {pageButtons[pageButtons.length - 1] < lastPage - 1 && (
                                            <span className="px-2 text-muted-foreground">…</span>
                                        )}
                                        {pageButtons[pageButtons.length - 1] < lastPage && (
                                            <Button variant="ghost" size="sm" onClick={() => goToPage(lastPage)}>{lastPage}</Button>
                                        )}

                                        <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= lastPage}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => goToPage(lastPage)} disabled={page >= lastPage}>
                                            <ChevronsRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View order dialog */}
            <Dialog open={!!viewOrder} onOpenChange={(v) => !v && setViewOrder(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Comanda #{viewOrder?.id}</DialogTitle></DialogHeader>
                    {viewOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Data</div>
                                    <div className="font-medium">{formatDate(viewOrder.created_at)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Status</div>
                                    <div className="font-medium">{ORDER_STATUS_LABEL[viewOrder.status] ?? viewOrder.status}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Client</div>
                                    <div className="font-medium">{viewOrder.customer_name}</div>
                                    <div className="text-sm text-muted-foreground">{viewOrder.customer_phone}</div>
                                    {!!viewOrder.user?.email && <div className="text-sm text-muted-foreground">{viewOrder.user.email}</div>}
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Livrare</div>
                                    <div className="font-medium">{viewOrder.delivery_type === 'delivery' ? 'Livrare' : 'Ridicare'}</div>
                                    {viewOrder.delivery_type === 'delivery' && (
                                        <div className="text-sm text-muted-foreground">{viewOrder.address_text || '-'}</div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="text-sm text-muted-foreground mb-2">Produse</div>
                                <div className="space-y-2">
                                    {viewOrder.items.map((it) => (
                                        <div key={it.id} className="flex items-center justify-between text-sm">
                                            <div className="truncate">
                                                {it.product_name} <span className="text-muted-foreground">× {it.quantity}</span>
                                            </div>
                                            <div className="font-medium">{formatPrice(it.line_total)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div className="text-sm space-y-1">
                                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(viewOrder.subtotal)}</span></div>
                                {viewOrder.discount > 0 && <div className="flex justify-between text-green-600"><span>Reducere</span><span>-{formatPrice(viewOrder.discount)}</span></div>}
                                <div className="flex justify-between"><span>Livrare</span><span>{viewOrder.delivery_type === 'pickup' ? 'Gratuit' : formatPrice(viewOrder.delivery_fee)}</span></div>
                                <Separator />
                                <div className="flex justify-between font-semibold"><span>Total</span><span className="text-primary">{formatPrice(viewOrder.total)}</span></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create order dialog */}
            <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}

/* ===========================
   Dialog creare comandă
   =========================== */

function CreateOrderDialog({
                               open,
                               onOpenChange,
                               initial,
                           }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initial?: { name?: string | null; phone?: string | null; addresses?: ClientAddress[] };
}) {
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

    const [name, setName] = useState(initial?.name || '');
    const [phone, setPhone] = useState(initial?.phone || '');
    const [addresses, setAddresses] = useState<ClientAddress[]>(initial?.addresses || []);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [addressText, setAddressText] = useState<string>('');

    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [zoneId, setZoneId] = useState<string>('');
    const zone = useMemo(() => zones.find((z) => String(z.id) === String(zoneId)) || null, [zones, zoneId]);

    const [notes, setNotes] = useState('');

    // products
    const [prodQ, setProdQ] = useState('');
    const [prodDebounced, setProdDebounced] = useState('');
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [prodResults, setProdResults] = useState<ProductLite[]>([]);
    const [items, setItems] = useState<{ product: ProductLite; quantity: number }[]>([]);

    const [offers, setOffers] = useState<Offer[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // on open: load zones + offers
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const [zonesRes, offersRes] = await Promise.all([
                    apiClient.getDeliveryZones({ active: 1 }),
                    apiClient.getOffers(),
                ]);

                // zones normalize
                const rawZones = Array.isArray(zonesRes) ? zonesRes : zonesRes?.data ?? [];
                const normalizedZones: DeliveryZone[] = rawZones.map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    deliveryFee: Number(z.deliveryFee ?? z.delivery_fee ?? 0),
                    minOrder: Number(z.minOrder ?? z.min_order ?? 0),
                }));
                setZones(normalizedZones);

                // offers normalize (active public)
                const rawOffers = Array.isArray(offersRes?.data) ? offersRes.data : Array.isArray(offersRes) ? offersRes : [];
                const normalizedOffers: Offer[] = rawOffers.map((o: any) => ({
                    id: Number(o.id),
                    code: o.code ?? null,
                    name: o.name,
                    description: o.description ?? null,
                    type: o.type,
                    value: Number(o.value ?? 0),
                    application_type: o.application_type,
                    category_id: o.category_id ?? null,
                    products: Array.isArray(o.products) ? o.products.map((p: any) => ({ id: Number(p.id) })) : [],
                    conditions: o.conditions ?? null,
                    stackable: !!o.stackable,
                    priority: typeof o.priority === 'number' ? o.priority : 0,
                }));
                setOffers(normalizedOffers);
            } catch (e) {
                setZones([]);
                setOffers([]);
            }
        })();
    }, [open]);

    // reset state when opening
    useEffect(() => {
        if (!open) return;
        setName(initial?.name || '');
        setPhone(initial?.phone || '');
        setAddresses(initial?.addresses || []);
        const def = (initial?.addresses || []).find((a) => a.is_default);
        if (def) {
            setSelectedAddressId(String(def.id));
            setAddressText(`${def.city ? def.city + ', ' : ''}${def.address}`);
        } else {
            setSelectedAddressId('');
            setAddressText('');
        }
        setNotes('');
        setItems([]);
        setZoneId('');
        setDeliveryType('delivery');
        setPaymentMethod('cash');
        setProdQ('');
        setProdDebounced('');
        setProdResults([]);
    }, [open, initial]);

    // change address text on selection
    useEffect(() => {
        if (!selectedAddressId) return;
        const a = addresses.find((x) => String(x.id) === String(selectedAddressId));
        if (a) setAddressText(`${a.city ? a.city + ', ' : ''}${a.address}`);
    }, [selectedAddressId, addresses]);

    // debounce product search
    useEffect(() => {
        const t = setTimeout(() => setProdDebounced(prodQ.trim()), 350);
        return () => clearTimeout(t);
    }, [prodQ]);

    // perform product search
    useEffect(() => {
        if (!open) return;
        if (!prodDebounced) {
            setProdResults([]);
            return;
        }
        (async () => {
            try {
                setSearchingProducts(true);
                const res = await apiClient.searchProducts({ q: prodDebounced, pageSize: 10 });
                const listRaw = res?.data ?? res ?? [];
                const list: ProductLite[] = listRaw.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price ?? 0),
                    category_id: p.category_id ?? null,
                }));
                setProdResults(list);
            } catch {
                setProdResults([]);
            } finally {
                setSearchingProducts(false);
            }
        })();
    }, [prodDebounced, open]);

    // prefill by phone (client/guest)
    const lookupByPhone = useCallback(
        async (ph: string) => {
            const clean = ph.trim();
            if (clean.length < 6) return;
            try {
                const found = await apiClient.lookupClientByPhone(clean);
                if (!found) return;
                setName(found.name || name);
                setPhone(found.phone || clean);
                const arr: ClientAddress[] = (found.addresses ?? []).map((a: any) => ({
                    id: a.id,
                    city: a.city ?? '',
                    address: a.address ?? '',
                    is_default: !!(a.is_default ?? a.isDefault),
                    label: a.label ?? null,
                }));
                setAddresses(arr);
                const def = arr.find((a) => a.is_default);
                if (def) {
                    setSelectedAddressId(String(def.id));
                    setAddressText(`${def.city ? def.city + ', ' : ''}${def.address}`);
                }
                toast.success('Date client precompletate');
            } catch {
                // ignore dacă nu găsește
            }
        },
        [name]
    );

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            if (phone && phone.trim().length >= 6) {
                lookupByPhone(phone);
            }
        }, 500);
        return () => clearTimeout(t);
    }, [phone, lookupByPhone, open]);

    // manage items
    const addProduct = (p: ProductLite) => {
        setItems((prev) => {
            const idx = prev.findIndex((i) => String(i.product.id) === String(p.id));
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                return next;
            }
            return [...prev, { product: p, quantity: 1 }];
        });
        setProdQ('');
        setProdResults([]);
    };
    const inc = (id: string | number) =>
        setItems((prev) => prev.map((i) => (String(i.product.id) === String(id) ? { ...i, quantity: i.quantity + 1 } : i)));
    const dec = (id: string | number) =>
        setItems((prev) =>
            prev.map((i) => {
                if (String(i.product.id) !== String(id)) return i;
                const q = Math.max(1, i.quantity - 1);
                return { ...i, quantity: q };
            })
        );
    const removeItem = (id: string | number) => setItems((prev) => prev.filter((i) => String(i.product.id) !== String(id)));

    // totals
    const subtotal = useMemo(() => items.reduce((s, it) => s + it.product.price * it.quantity, 0), [items]);
    const deliveryFee = deliveryType === 'delivery' ? (zone?.deliveryFee ?? 0) : 0;

    // offers application (client-side)
    const { discount, applied_offers } = useMemo(() => {
        if (!offers.length || items.length === 0) return { discount: 0, applied_offers: [] as any[] };

        // copy items as a map: product_id -> {price, qty, category_id}
        const map = new Map<
            number,
            { price: number; qty: number; category_id: number | null }
        >();
        for (const it of items) {
            const pid = Number(it.product.id);
            const prev = map.get(pid);
            map.set(pid, {
                price: Number(it.product.price),
                qty: (prev?.qty ?? 0) + it.quantity,
                category_id: it.product.category_id ?? null,
            });
        }

        let totalDiscount = 0;
        const applied: any[] = [];

        // helpers
        const totalQty = Array.from(map.values()).reduce((s, v) => s + v.qty, 0);
        const getSubtotal = () => Array.from(map.entries()).reduce((s, [_, v]) => s + v.price * v.qty, 0);

        const byPriority = [...offers].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

        for (const off of byPriority) {
            const cond = off.conditions || {};
            const minItems = typeof cond.minItems === 'number' ? cond.minItems : undefined;
            const minSubtotal = typeof cond.minSubtotal === 'number' ? cond.minSubtotal : undefined;

            // target set of lines this offer applies to
            let targetPids: number[] = [];

            if (off.application_type === 'cart') {
                // whole cart
                if ((minItems && totalQty < minItems) || (minSubtotal && getSubtotal() < minSubtotal)) {
                    continue;
                }
                targetPids = Array.from(map.keys());
            } else if (off.application_type === 'category') {
                const catId = off.category_id ? Number(off.category_id) : null;
                const pids = Array.from(map.entries())
                    .filter(([_, v]) => (catId ? v.category_id === catId : false))
                    .map(([pid]) => pid);
                if (pids.length === 0) continue;
                const subsetQty = pids.reduce((s, pid) => s + (map.get(pid)?.qty ?? 0), 0);
                const subsetSum = pids.reduce((s, pid) => {
                    const v = map.get(pid)!;
                    return s + v.price * v.qty;
                }, 0);
                if ((minItems && subsetQty < minItems) || (minSubtotal && subsetSum < minSubtotal)) {
                    continue;
                }
                targetPids = pids;
            } else if (off.application_type === 'product_ids') {
                const eligible = (off.products ?? []).map((p) => Number(p.id));
                const pids = Array.from(map.keys()).filter((pid) => eligible.includes(pid));
                if (pids.length === 0) continue;
                const subsetQty = pids.reduce((s, pid) => s + (map.get(pid)?.qty ?? 0), 0);
                const subsetSum = pids.reduce((s, pid) => {
                    const v = map.get(pid)!;
                    return s + v.price * v.qty;
                }, 0);
                if ((minItems && subsetQty < minItems) || (minSubtotal && subsetSum < minSubtotal)) {
                    continue;
                }
                targetPids = pids;
            }

            // compute discount
            let offDiscount = 0;

            if (off.type === 'PERCENT') {
                const base =
                    targetPids.reduce((s, pid) => {
                        const v = map.get(pid)!;
                        return s + v.price * v.qty;
                    }, 0) || 0;
                offDiscount = Math.max(0, Math.round((base * off.value) * 100) / 100) / 100; // (value e.g. 10 => 10%)
                // fix percent normalization
                offDiscount = Number(((base * (off.value / 100))).toFixed(2));
            } else if (off.type === 'FIXED') {
                // fixed lei discount applied on target sum
                const base = targetPids.reduce((s, pid) => {
                    const v = map.get(pid)!;
                    return s + v.price * v.qty;
                }, 0);
                offDiscount = Number(Math.min(base, off.value).toFixed(2));
            } else if (off.type === 'BXGY') {
                const bxgy = off.conditions?.bxgy;
                const buy = bxgy?.buy ?? 0;
                const get = bxgy?.get ?? 0;
                if (buy > 0 && get > 0) {
                    // Apply per product among target pids
                    for (const pid of targetPids) {
                        const v = map.get(pid)!;
                        const group = buy + get;
                        const groups = Math.floor(v.qty / group);
                        const freeUnitsRaw = groups * get;
                        const limit = typeof bxgy?.limit === 'number' ? bxgy.limit : undefined;
                        const freeUnits = limit ? Math.min(limit, freeUnitsRaw) : freeUnitsRaw;
                        if (freeUnits > 0) {
                            offDiscount += Number((freeUnits * v.price).toFixed(2));
                        }
                    }
                }
            }

            if (offDiscount > 0) {
                totalDiscount += offDiscount;
                applied.push({
                    id: off.id,
                    code: off.code ?? null,
                    name: off.name,
                    type: off.type,
                    application_type: off.application_type,
                    amount: Number(offDiscount.toFixed(2)),
                });

                // if not stackable, stop
                if (!off.stackable) {
                    break;
                }
            }
        }

        return { discount: Number(totalDiscount.toFixed(2)), applied_offers: applied };
    }, [offers, items]);

    const total = Math.max(0, subtotal - discount + (deliveryType === 'delivery' ? (zone?.deliveryFee ?? 0) : 0));

    const minOrderMissing = useMemo(() => {
        if (deliveryType !== 'delivery' || !zone) return 0;
        const effective = Math.max(0, subtotal - discount);
        const missing = Math.max(0, zone.minOrder - effective);
        return Number(missing.toFixed(2));
    }, [deliveryType, zone, subtotal, discount]);

    const canSubmit = useMemo(() => {
        if (items.length === 0) return false;
        if (!name.trim() || !phone.trim()) return false;
        if (deliveryType === 'delivery') {
            if (!zone) return false;
            if (!addressText.trim()) return false;
            if (minOrderMissing > 0) return false;
        }
        return true;
    }, [items.length, name, phone, deliveryType, zone, addressText, minOrderMissing]);

    const submit = async () => {
        if (!canSubmit) {
            toast.error('Completează datele comenzii.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                order_id: generateOrderId(),
                delivery_type: deliveryType,
                payment_method: paymentMethod,
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                address_id: selectedAddressId ? Number(selectedAddressId) : undefined,
                address_text: deliveryType === 'delivery' ? addressText.trim() : null,
                delivery_zone_id: zone ? Number(zone.id) : null,
                delivery_fee: deliveryType === 'delivery' ? (zone?.deliveryFee ?? 0) : 0,
                notes: notes.trim() || null,
                items: items.map((i) => ({ product_id: Number(i.product.id), quantity: i.quantity })),
                discount,
                applied_offers,
            } as const;

            const resp = await apiClient.createOrder(payload);
            toast.success(`Comandă creată #${resp?.id ?? ''}`);
            onOpenChange(false);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Nu am putut crea comanda');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95%] md:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Comandă nouă</DialogTitle>
                </DialogHeader>

                <div className="max-h-[80vh] overflow-y-auto px-1 md:px-4 py-2 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Stânga */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Tip livrare */}
                            <Card>
                                <CardHeader><CardTitle className="text-base">Livrare / Ridicare</CardTitle></CardHeader>
                                <CardContent>
                                    <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)} className="grid grid-cols-2 gap-3">
                                        <Label className="border rounded-md p-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="delivery" id="del" />
                                                <span>Livrare</span>
                                            </div>
                                        </Label>
                                        <Label className="border rounded-md p-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="pickup" id="pick" />
                                                <span>Ridicare</span>
                                            </div>
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>

                            {/* Client */}
                            <Card>
                                <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Telefon *</Label>
                                        <Input
                                            placeholder="07xx xxx xxx"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            inputMode="tel"
                                        />
                                        <p className="text-xs text-muted-foreground">Se face precompletare dacă există client/guest cu acest număr.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Nume *</Label>
                                        <Input placeholder="ex: Popescu Ion" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>

                                    {deliveryType === 'delivery' && (
                                        <>
                                            {addresses.length > 0 && (
                                                <div className="space-y-1 md:col-span-2">
                                                    <Label>Adresă salvată</Label>
                                                    <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                                        <SelectTrigger><SelectValue placeholder="Selectează o adresă" /></SelectTrigger>
                                                        <SelectContent>
                                                            {addresses.map((a) => (
                                                                <SelectItem key={String(a.id)} value={String(a.id)}>
                                                                    {(a.label ? `${a.label} — ` : '') + `${a.city ?? ''}${a.city ? ', ' : ''}${a.address}`}{a.is_default ? ' (implicită)' : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <div className="space-y-1 md:col-span-2">
                                                <Label>Adresă completă *</Label>
                                                <Input
                                                    placeholder="Str. Mihai Viteazu nr. 15, bl. A2, ap. 12"
                                                    value={addressText}
                                                    onChange={(e) => setAddressText(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <Label>Zonă de livrare *</Label>
                                                <Select value={zoneId} onValueChange={setZoneId}>
                                                    <SelectTrigger><SelectValue placeholder="Selectează zona" /></SelectTrigger>
                                                    <SelectContent>
                                                        {zones.map((z) => (
                                                            <SelectItem key={String(z.id)} value={String(z.id)}>
                                                                {z.name} — taxă {formatPrice(z.deliveryFee)} · min {formatPrice(z.minOrder)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {zone && minOrderMissing > 0 && (
                                                <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                                                    Comandă minimă pentru <strong>{zone.name}</strong>: {formatPrice(zone.minOrder)}. Mai adaugă <strong>{formatPrice(minOrderMissing)}</strong>.
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="space-y-1 md:col-span-2">
                                        <Label>Observații</Label>
                                        <Input placeholder="Instrucțiuni..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Plată */}
                            <Card>
                                <CardHeader><CardTitle className="text-base">Metodă de plată</CardTitle></CardHeader>
                                <CardContent>
                                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="grid grid-cols-2 gap-3">
                                        <Label className="border rounded-md p-3 cursor-pointer flex items-center gap-2">
                                            <RadioGroupItem value="cash" id="pm-cash" />
                                            <Banknote className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            <span>Numerar</span>
                                        </Label>
                                        <Label className="border rounded-md p-3 cursor-pointer flex items-center gap-2">
                                            <RadioGroupItem value="card" id="pm-card" />
                                            <CreditCard className="w-4 h-4 text-[hsl(var(--primary))]" />
                                            <span>Card</span>
                                        </Label>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Dreapta */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Adaugă produse</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <Input
                                            placeholder="Caută produs..."
                                            value={prodQ}
                                            onChange={(e) => setProdQ(e.target.value)}
                                        />
                                        {prodQ && (
                                            <div className="mt-2 max-h-56 overflow-y-auto border rounded-md">
                                                {searchingProducts && <div className="p-3 text-sm text-muted-foreground">Se caută...</div>}
                                                {!searchingProducts && prodResults.length === 0 && (
                                                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2"><PackageSearch className="w-4 h-4" /> Niciun produs</div>
                                                )}
                                                {prodResults.map((p) => (
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

                                    {items.length > 0 && (
                                        <div className="space-y-2">
                                            {items.map((it) => (
                                                <div key={String(it.product.id)} className="flex items-center justify-between border rounded-md px-3 py-2">
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{it.product.name}</div>
                                                        <div className="text-xs text-muted-foreground">{formatPrice(it.product.price)} / buc</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => dec(it.product.id)}>-</Button>
                                                        <div className="w-8 text-center font-medium">{it.quantity}</div>
                                                        <Button variant="outline" size="sm" onClick={() => inc(it.product.id)}>+</Button>
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(it.product.id)} title="Șterge">
                                                            ✕
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {items.length === 0 && (
                                        <div className="text-sm text-muted-foreground">Adaugă produse pentru a configura comanda.</div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle className="text-base">Sumar</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Reducere</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Livrare</span>
                                        <span>{deliveryType === 'pickup' ? 'Gratuit' : zone ? formatPrice(zone.deliveryFee) : '—'}</span>
                                    </div>

                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-primary">{formatPrice(total)}</span>
                                    </div>

                                    <Button className="w-full mt-3" onClick={submit} disabled={!canSubmit || submitting}>
                                        {submitting ? 'Se trimite...' : 'Creează comanda'}
                                    </Button>

                                    {deliveryType === 'delivery' && !zone && (
                                        <div className="text-xs text-muted-foreground mt-1">Selectează zona pentru livrare.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
