'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Search, User, Phone, Mail, MapPin, Calendar, ShoppingBag, Eye,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
    Plus, Minus, Trash2, CreditCard, Banknote,
} from 'lucide-react';
import {formatPrice, formatDate, generateOrderId} from '@/lib/format';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import type { Client } from '@/types';
import { useCartStore } from '@/store/cart';

/** Tipuri simple pentru dialog */
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
type ProductLite = { id: number | string; name: string; price: number };

export default function AdminClientsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createInitial, setCreateInitial] = useState<{
        name?: string | null;
        phone?: string | null;
        addresses?: ClientAddress[];
    } | null>(null);

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const PAGE_SIZE = 20;

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebounced(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getAdminClients({
                search: debounced.trim(),
                page,
                pageSize: PAGE_SIZE,
            });

            const list: Client[] = (res?.data ?? []).map((c: any) => ({
                id: String(c.id),
                name: c.name,
                phone: c.phone ?? null,
                email: c.email ?? null,
                totalOrders: Number(c.totalOrders ?? 0),
                totalSpent: Number(c.totalSpent ?? 0),
                lastOrder: c.lastOrder ?? null,
                created_at: c.created_at ?? c.createdAt ?? null,
                addresses: (c.addresses ?? []).map((a: any) => ({
                    id: String(a.id),
                    address: a.address,
                    city: a.city ?? null,
                    isDefault: !!(a.isDefault ?? a.is_default),
                    lastUsed: a.lastUsed ?? null,
                    label: a.label ?? null,
                    lat: a.lat ?? null,
                    lng: a.lng ?? null,
                })),
            }));

            setClients(list);
            setTotal(res?.total ?? list.length);
            setPage(res?.current_page ?? page);
            setLastPage(res?.last_page ?? 1);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea clienților');
        } finally {
            setLoading(false);
        }
    };

    // reload on search/page changes
    useEffect(() => { loadClients(); }, [debounced, page]); // eslint-disable-line
    // reset to page 1 on new search
    useEffect(() => { setPage(1); }, [debounced]);

    const filteredClients = useMemo(() => clients, [clients]);

    const handleViewClient = async (client: Client) => {
        try {
            const res = await apiClient.getAdminClient(client.id);
            const c = res as any;
            const enriched: Client = {
                id: String(c.id),
                name: c.name,
                phone: c.phone ?? null,
                email: c.email ?? null,
                totalOrders: Number(c.totalOrders ?? 0),
                totalSpent: Number(c.totalSpent ?? 0),
                lastOrder: c.lastOrder ?? null,
                created_at: c.created_at ?? c.createdAt ?? null,
                addresses: (c.addresses ?? []).map((a: any) => ({
                    id: String(a.id),
                    address: a.address,
                    city: a.city ?? null,
                    isDefault: !!(a.isDefault ?? a.is_default),
                    lastUsed: a.lastUsed ?? null,
                    label: a.label ?? null,
                    lat: a.lat ?? null,
                    lng: a.lng ?? null,
                })),
            };
            setSelectedClient(enriched);
            setIsClientDialogOpen(true);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea detaliilor clientului');
        }
    };

    const getClientStatus = (client: Client) => {
        const last = client.lastOrder ? new Date(client.lastOrder) : null;
        const daysSinceLastOrder = last ? Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24)) : 9999;

        if (daysSinceLastOrder <= 7) return { label: 'Activ', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' };
        if (daysSinceLastOrder <= 30) return { label: 'Regulat', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' };
        if (daysSinceLastOrder <= 90) return { label: 'Inactiv', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' };
        return { label: 'Dormant', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' };
    };

    // pagination helpers
    const startIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);
    const endIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + clients.length), [page, total, clients.length]);

    const goToPage = (p: number) => {
        const np = Math.max(1, Math.min(lastPage, p));
        if (np !== page) setPage(np);
    };

    // show up to 5 pages around current
    const pageButtons = useMemo(() => {
        const maxBtns = 5;
        let start = Math.max(1, page - Math.floor(maxBtns / 2));
        let end = Math.min(lastPage, start + maxBtns - 1);
        if (end - start + 1 < maxBtns) {
            start = Math.max(1, end - maxBtns + 1);
        }
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
    }, [page, lastPage]);

    const openCreateOrder = () => {
        setCreateInitial(null);
        setCreateOpen(true);
    };

    const openCreateFromClient = (c: Client) => {
        const init: typeof createInitial = {
            name: c.name ?? '',
            phone: c.phone ?? '',
            addresses: (c.addresses ?? []).map((a: any) => ({
                id: a.id,
                city: a.city ?? '',
                address: a.address ?? '',
                is_default: !!(a.isDefault ?? a.is_default),
                label: a.label ?? null,
            })),
        };
        setCreateInitial(init);
        setCreateOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Clienți</h1>
                    <p className="text-muted-foreground">Gestionează baza de date cu clienții și adresele lor</p>
                </div>
                <Button onClick={openCreateOrder}>
                    <Plus className="w-4 h-4 mr-2" />
                    Creează comandă
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută după nume, telefon sau email..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); }}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--primary))]">{total}</p>
                            <p className="text-sm text-muted-foreground">Total clienți</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {clients.filter(c => {
                                    const d = c.lastOrder ? Math.floor((Date.now() - new Date(c.lastOrder).getTime()) / (1000*60*60*24)) : 9999;
                                    return d <= 7;
                                }).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Activi (7 zile)</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                                {clients.reduce((sum, c) => sum + c.totalOrders, 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total comenzi</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                                {formatPrice(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
                            </p>
                            <p className="text-sm text-muted-foreground">Venituri totale</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Clients Table */}
            <Card>
                <CardHeader><CardTitle>Clienți ({total})</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Se încarcă clienții...</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Comenzi</TableHead>
                                        <TableHead>Total cheltuit</TableHead>
                                        <TableHead>Ultima comandă</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Acțiuni</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => {
                                        const status = getClientStatus(client);
                                        return (
                                            <TableRow key={client.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-[hsl(var(--primary))]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{client.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Client din {client.created_at ? formatDate(client.created_at).split(',')[0] : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {client.phone && (
                                                            <div className="flex items-center space-x-2 text-sm">
                                                                <Phone className="w-3 h-3 text-muted-foreground" />
                                                                <span>{client.phone}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                            <span className="truncate max-w-[180px]">{client.email ?? '-'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-semibold">{client.totalOrders}</span>
                                                        <span className="text-sm text-muted-foreground">comenzi</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="font-semibold text-[hsl(var(--primary))]">
                                                    {formatPrice(client.totalSpent)}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        <span>{client.lastOrder ? formatDate(client.lastOrder).split(',')[0] : '-'}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                                                </TableCell>

                                                <TableCell className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)} title="Vezi detalii">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => openCreateFromClient(client)}>
                                                        <Plus className="w-4 h-4 mr-1" /> Comandă
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {filteredClients.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">👥</div>
                                    <h3 className="text-lg font-medium mb-2">Nu s-au găsit clienți</h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery ? 'Încearcă să modifici termenul de căutare' : 'Nu există clienți încă'}
                                    </p>
                                </div>
                            )}

                            {/* Pagination (from backend) */}
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

            {/* Client Details Dialog */}
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Detalii client</DialogTitle></DialogHeader>

                    {selectedClient && (
                        <div className="space-y-6">
                            {/* Client Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <User className="w-5 h-5" />
                                        <span>Informații generale</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Nume</Label>
                                            <p className="font-semibold">{selectedClient.name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
                                            <p className="font-semibold">{selectedClient.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                            <p className="font-semibold">{selectedClient.email ?? '-'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                            <Badge variant="secondary" className={getClientStatus(selectedClient).color}>
                                                {getClientStatus(selectedClient).label}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                                                {selectedClient.totalOrders}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Comenzi totale</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                                                {formatPrice(selectedClient.totalSpent)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Total cheltuit</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {selectedClient.totalOrders > 0
                                                    ? formatPrice(selectedClient.totalSpent / selectedClient.totalOrders)
                                                    : formatPrice(0)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Comandă medie</p>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button onClick={() => openCreateFromClient(selectedClient)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Creează comandă pentru acest client
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Addresses */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <MapPin className="w-5 h-5" />
                                        <span>Adrese de livrare ({selectedClient.addresses.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {selectedClient.addresses.map(address => (
                                            <div key={address.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
                                                            <span className="font-medium">{address.city || '-'}</span>
                                                            {address.isDefault && (
                                                                <Badge variant="secondary" className="text-xs">Implicită</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{address.address}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedClient.addresses.length === 0 && (
                                            <div className="text-sm text-muted-foreground">Nu există adrese salvate.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Order Dialog */}
            <CreateOrderDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                initial={createInitial || undefined}
            />

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">💡 Informații despre clienți</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Activ:</strong> A comandat în ultimele 7 zile</li>
                        <li>• <strong>Regulat:</strong> A comandat în ultimele 30 de zile</li>
                        <li>• <strong>Inactiv:</strong> A comandat în ultimele 90 de zile</li>
                        <li>• <strong>Dormant:</strong> Nu a comandat de peste 90 de zile</li>
                        <li>• Poți căuta după nume, telefon sau adresă email</li>
                        <li>• Click pe un client pentru a vedea toate adresele sale</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

/* ===========================
   CreateOrderDialog Component
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
    const [deliveryType, setDeliveryType] = useState<'delivery'|'pickup'>('delivery');
    const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'>('cash');

    const [name, setName] = useState(initial?.name || '');
    const [phone, setPhone] = useState(initial?.phone || '');
    const [addresses, setAddresses] = useState<ClientAddress[]>(initial?.addresses || []);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [addressText, setAddressText] = useState<string>('');

    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [zoneId, setZoneId] = useState<string>('');
    const zone = useMemo(() => zones.find(z => String(z.id) === String(zoneId)) || null, [zones, zoneId]);

    const [notes, setNotes] = useState('');

    // products
    const [prodQ, setProdQ] = useState('');
    const [prodDebounced, setProdDebounced] = useState('');
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [prodResults, setProdResults] = useState<ProductLite[]>([]);
    const [items, setItems] = useState<{ product: ProductLite; quantity: number }[]>([]);

    const [submitting, setSubmitting] = useState(false);

    // offers from cart store (reused logic from storefront)
    const offers            = useCartStore((s: any) => s.offers || []);
    const offersInitialized = useCartStore((s: any) => s.offersInitialized);
    const offersLoading     = useCartStore((s: any) => s.offersLoading);
    const refreshOffers     = useCartStore((s: any) => s.refreshOffers);

    // ensure offers are loaded when dialog opens
    useEffect(() => {
        if (!open) return;
        if (!offersInitialized && !offersLoading) {
            refreshOffers().catch(() => {});
        }
    }, [open, offersInitialized, offersLoading, refreshOffers]);

    // load zones when opening
    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const res = await apiClient.getDeliveryZones({ active: 1 });
                const raw = Array.isArray(res) ? res : res?.data ?? [];
                const normalized: DeliveryZone[] = raw.map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    deliveryFee: Number(z.deliveryFee ?? z.delivery_fee ?? 0),
                    minOrder: Number(z.minOrder ?? z.min_order ?? 0),
                }));
                setZones(normalized);
            } catch {
                setZones([]);
            }
        })();
    }, [open]);

    // prefill default address when opening/initial changes
    useEffect(() => {
        if (!open) return;
        setName(initial?.name || '');
        setPhone(initial?.phone || '');
        setAddresses(initial?.addresses || []);
        const def = (initial?.addresses || []).find(a => a.is_default);
        if (def) {
            setSelectedAddressId(String(def.id));
            setAddressText(`${def.city ?? ''}${def.city ? ', ' : ''}${def.address}`);
        } else {
            setSelectedAddressId('');
            setAddressText('');
        }
        setNotes('');
        setItems([]);
        setZoneId('');
        setDeliveryType('delivery');
        setPaymentMethod('cash');
    }, [open, initial]);

    // change address text when select a saved address
    useEffect(() => {
        if (!selectedAddressId) return;
        const a = addresses.find(x => String(x.id) === String(selectedAddressId));
        if (a) setAddressText(`${a.city ?? ''}${a.city ? ', ' : ''}${a.address}`);
    }, [selectedAddressId, addresses]);

    // debounce product search
    useEffect(() => {
        const t = setTimeout(() => setProdDebounced(prodQ.trim()), 350);
        return () => clearTimeout(t);
    }, [prodQ]);

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
                const list: ProductLite[] = (res?.data ?? res ?? []).map((p: any) => ({
                    id: p.id, name: p.name, price: Number(p.price ?? 0),
                }));
                setProdResults(list);
            } catch {
                setProdResults([]);
            } finally {
                setSearchingProducts(false);
            }
        })();
    }, [prodDebounced, open]);

    // lookup client/guest by phone to prefill
    const lookupByPhone = useCallback(async (ph: string) => {
        const clean = ph.trim();
        if (clean.length < 6) return; // prea scurt; evităm spam
        try {
            const found = await apiClient.lookupClientByPhone(clean);
            if (!found) return;
            // așteptăm { name, phone, addresses? [] }
            setName(found.name || name);
            setPhone(found.phone || clean);
            const arr: ClientAddress[] = (found.addresses ?? []).map((a: any) => ({
                id: a.id, city: a.city ?? '', address: a.address ?? '', is_default: !!(a.is_default ?? a.isDefault), label: a.label ?? null,
            }));
            setAddresses(arr);
            const def = arr.find(a => a.is_default);
            if (def) {
                setSelectedAddressId(String(def.id));
                setAddressText(`${def.city ? def.city + ', ' : ''}${def.address}`);
            }
            toast.success('Date client precompletate');
        } catch {
            // no-op dacă nu găsește
        }
    }, [name]);

    // trigger lookup when phone stops changing
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            if (phone && phone.trim().length >= 6) {
                lookupByPhone(phone);
            }
        }, 500);
        return () => clearTimeout(t);
    }, [phone, lookupByPhone, open]);

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
        setProdQ('');
        setProdResults([]);
    };

    const inc = (id: string | number) => setItems(prev => prev.map(i => String(i.product.id) === String(id) ? { ...i, quantity: i.quantity + 1 } : i));
    const dec = (id: string | number) => setItems(prev => prev.map(i => {
        if (String(i.product.id) !== String(id)) return i;
        const q = Math.max(1, i.quantity - 1);
        return { ...i, quantity: q };
    }));
    const removeItem = (id: string | number) => setItems(prev => prev.filter(i => String(i.product.id) !== String(id)));

    // ====== OFFERS LOGIC =======
    type AppliedOffer = { code?: string; type: string; value: number; label?: string };
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const computeAppliedOffers = useCallback((
        activeOffers: any[],
        subtotalVal: number,
        deliveryTypeVal: 'delivery' | 'pickup',
        deliveryFeeVal: number
    ): { discount: number; applied: AppliedOffer[] } => {
        if (!Array.isArray(activeOffers) || activeOffers.length === 0) {
            return { discount: 0, applied: [] };
        }

        let discount = 0;
        const applied: AppliedOffer[] = [];

        for (const o of activeOffers) {
            if (o?.active === false) continue;

            const type = String(o.type ?? '').toLowerCase();     // ex: percent / fixed / free_delivery
            const code = o.code ?? o.slug ?? o.id ?? undefined;
            const label= o.name ?? o.title ?? o.label ?? undefined;
            const min  = Number(o.minSubtotal ?? o.min_subtotal ?? 0);

            // prag minim pe subtotal (fără taxe)
            if (subtotalVal < min) continue;

            if (type === 'percent' || type === 'percent_order') {
                const pct = Math.max(0, Number(o.value ?? 0));
                if (pct > 0) {
                    const d = round2(subtotalVal * pct / 100);
                    discount += d;
                    applied.push({ code, type: 'percent', value: d, label: label ?? `${pct}% reducere` });
                }
            }

            if (type === 'fixed' || type === 'fixed_order') {
                const val = Math.max(0, Number(o.value ?? 0));
                if (val > 0) {
                    discount += val;
                    applied.push({ code, type: 'fixed', value: val, label: label ?? `- ${formatPrice(val)}` });
                }
            }

            if (type === 'free_delivery') {
                if (deliveryTypeVal === 'delivery' && deliveryFeeVal > 0) {
                    const d = round2(deliveryFeeVal);
                    discount += d; // contăm benefitul ca discount
                    applied.push({ code, type: 'free_delivery', value: d, label: label ?? `Livrare gratuită` });
                }
            }
        }

        discount = Math.min(discount, subtotalVal);
        return { discount: round2(discount), applied };
    }, []);

    // subtotal existent
    const subtotal = useMemo(
        () => items.reduce((s, it) => s + it.product.price * it.quantity, 0),
        [items]
    );

    // taxa de livrare "brută" din zonă (fără free_delivery)
    const baseDeliveryFee = deliveryType === 'delivery' ? (zone?.deliveryFee ?? 0) : 0;

    // ofertele aplicate -> discount + listă
    const { discount: offersDiscount, applied: appliedOffers } = useMemo(() => {
        return computeAppliedOffers(offers, subtotal, deliveryType, baseDeliveryFee);
    }, [offers, subtotal, deliveryType, baseDeliveryFee, computeAppliedOffers]);

    // dacă există free_delivery, taxa de livrare efectivă devine 0
    const hasFreeDelivery = useMemo(
        () => appliedOffers.some(o => o.type === 'free_delivery'),
        [appliedOffers]
    );
    const effectiveDeliveryFee = deliveryType === 'delivery'
        ? (hasFreeDelivery ? 0 : baseDeliveryFee)
        : 0;

    // total final
    const total = useMemo(
        () => round2(Math.max(0, subtotal - offersDiscount + effectiveDeliveryFee)),
        [subtotal, offersDiscount, effectiveDeliveryFee]
    );

    // min order se verifică pe subtotal - offersDiscount (ca în checkout)
    const minOrderMissing = useMemo(() => {
        if (deliveryType !== 'delivery' || !zone) return 0;
        const effective = Math.max(0, subtotal - offersDiscount);
        const missing = Math.max(0, zone.minOrder - effective);
        return Number(missing.toFixed(2));
    }, [deliveryType, zone, subtotal, offersDiscount]);

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
        try {
            setSubmitting(true);
            const payload = {
                order_id: generateOrderId(),
                as_admin: 1, // hint pentru backend (poți ignora dacă tratezi automat user_id)
                delivery_type: deliveryType,
                payment_method: paymentMethod,
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                address_id: selectedAddressId ? Number(selectedAddressId) : undefined,
                address_text: deliveryType === 'delivery' ? addressText.trim() : null,
                delivery_zone_id: zone ? Number(zone.id) : null,
                delivery_fee: baseDeliveryFee, // taxa brută; backend calculează totalul
                notes: notes.trim() || null,
                items: items.map(i => ({ product_id: Number(i.product.id), quantity: i.quantity })),
                discount: offersDiscount, // ✅ reducere din oferte
                applied_offers: appliedOffers.map(o => ({
                    code: o.code ?? undefined,
                    type: o.type,
                    value: o.value,
                    label: o.label ?? undefined,
                })), // ✅ lista de oferte aplicate
            };

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
            <DialogContent className="max-w-[90%]">
                <DialogHeader>
                    <DialogTitle>Creează comandă</DialogTitle>
                </DialogHeader>

                <div className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Stânga: detalii */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Tip livrare */}
                            <Card>
                                <CardHeader><CardTitle className="text-base">Livrare / Ridicare</CardTitle></CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={deliveryType}
                                        onValueChange={(v) => setDeliveryType(v as any)}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        <Label className="border rounded-md p-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="delivery" id="co-del" />
                                                <span>Livrare</span>
                                            </div>
                                        </Label>
                                        <Label className="border rounded-md p-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="pickup" id="co-pick" />
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
                                        <p className="text-xs text-muted-foreground">
                                            Se face precompletare dacă există client/guest cu acest număr.
                                        </p>
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
                                                    <Select value={selectedAddressId} onValueChange={(v) => setSelectedAddressId(v)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selectează o adresă" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {addresses.map((a) => (
                                                                <SelectItem key={String(a.id)} value={String(a.id)}>
                                                                    {(a.label ? `${a.label} — ` : '') + `${a.city ?? ''}${a.city ? ', ' : ''}${a.address}`}
                                                                    {a.is_default ? ' (implicită)' : ''}
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
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selectează zona" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {zones.map(z => (
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
                                <CardHeader>
                                    <CardTitle className="text-base">Metodă plată</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={(v) => setPaymentMethod(v as any)}
                                        className="grid grid-cols-2 gap-3"
                                    >
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

                        {/* Dreapta: produse + sumar */}
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
                                            <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                                                {searchingProducts && <div className="p-3 text-sm text-muted-foreground">Se caută...</div>}
                                                {!searchingProducts && prodResults.length === 0 && (
                                                    <div className="p-3 text-sm text-muted-foreground">Niciun produs</div>
                                                )}
                                                {prodResults.map(p => (
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
                                            {items.map(it => (
                                                <div key={String(it.product.id)} className="flex items-center justify-between border rounded-md px-3 py-2">
                                                    <div className="min-w-0">
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

                                    {offersDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Reducere</span>
                                            <span>-{formatPrice(offersDiscount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Livrare</span>
                                        <span>{deliveryType === 'pickup' ? 'Gratuit' : formatPrice(effectiveDeliveryFee)}</span>
                                    </div>

                                    {appliedOffers.length > 0 && (
                                        <div className="pt-2 space-y-1">
                                            <div className="text-xs text-muted-foreground">Oferte aplicate:</div>
                                            {appliedOffers.map((o, idx) => (
                                                <div key={`${o.code ?? o.type}-${idx}`} className="text-xs text-green-700 dark:text-green-400">
                                                    • {o.label ?? o.code ?? o.type} ({formatPrice(o.value)})
                                                </div>
                                            ))}
                                        </div>
                                    )}

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
