// app/checkout/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import apiClient from '@/lib/api';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { CreditCard, Banknote, Plus, Minus, X } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

type DeliveryZone = {
  id: number | string;
  name: string;
  description?: string | null;
  deliveryFee: number;
  minOrder: number;
  active?: boolean;
};

type ClientAddress = {
  id: number | string;
  city: string;
  address: string;
  is_default?: boolean;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
  last_used_at?: string | null;
};

type PaymentMethod = 'cash' | 'card';

type LocalOrder = {
  id: string;
  createdAt: string;
  deliveryType: 'delivery' | 'pickup';
  deliveryFee: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  items: { product: any; quantity: number }[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items, subtotal, discount, total,
    deliveryType, deliveryZone,
    setDeliveryType, setDeliveryZone,
    clearCart,
    updateQuantity,           // 🆕 controls in checkout
    removeItem,               // 🆕 controls in checkout
  } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressText, setAddressText] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // auth awareness (ca să știu dacă pot crea adresă)
  const [canManageAddresses, setCanManageAddresses] = useState(false);

  // dialog add address
  const [addOpen, setAddOpen] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrAddress, setNewAddrAddress] = useState('');
  const [newAddrDefault, setNewAddrDefault] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [zonesRes, profile] = await Promise.allSettled([
          apiClient.getDeliveryZones({ active: 1 }),
          apiClient.getProfile().catch(() => null),
        ]);

        if (zonesRes.status === 'fulfilled') {
          const raw = Array.isArray(zonesRes.value) ? zonesRes.value : zonesRes.value?.data ?? [];
          const normalized: DeliveryZone[] = raw.map((z: any) => ({
            id: z.id,
            name: z.name,
            description: z.description ?? null,
            deliveryFee: Number(z.deliveryFee ?? z.delivery_fee ?? 0),
            minOrder: Number(z.minOrder ?? z.min_order ?? 0),
            active: Boolean(z.active ?? true),
          }));
          setZones(normalized);
        }

        if (profile && profile.status === 'fulfilled' && profile.value) {
          // profil (poate veni {user: {...}, addresses: [...]}, sau direct {...})
          const p = profile.value;
          const rawUser = p.user ?? p;
          const arr: ClientAddress[] = p.addresses ?? rawUser?.addresses ?? [];
          setAddresses(arr);
          setCanManageAddresses(true);

          const def = arr.find(a => a.is_default);
          if (def) {
            setSelectedAddressId(String(def.id));
            setAddressText(`${def.city}, ${def.address}`);
          }

          if (rawUser?.name) setCustomerName(rawUser.name);
          if (rawUser?.phone) setCustomerPhone(rawUser.phone);
        } else {
          setCanManageAddresses(false);
        }
      } catch (e) {
        console.warn('Profile/Zones load issue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // dacă schimbi adresa salvată -> populate textul
  useEffect(() => {
    if (!selectedAddressId) return;
    const a = addresses.find(x => String(x.id) === String(selectedAddressId));
    if (a) setAddressText(`${a.city}, ${a.address}`);
  }, [selectedAddressId, addresses]);

  const deliveryFee = useMemo(
      () => (deliveryType === 'delivery' ? (deliveryZone?.deliveryFee ?? 0) : 0),
      [deliveryType, deliveryZone]
  );

  const minOrderMissing = useMemo(() => {
    if (deliveryType !== 'delivery' || !deliveryZone) return 0;
    const effective = Math.max(0, subtotal - discount);
    const missing = Math.max(0, deliveryZone.minOrder - effective);
    return Number(missing.toFixed(2));
  }, [deliveryType, deliveryZone, subtotal, discount]);

  const canPlaceOrder = useMemo(() => {
    if (items.length === 0) return false;
    if (!customerName.trim() || !customerPhone.trim()) return false;
    if (deliveryType === 'delivery') {
      if (!deliveryZone) return false;
      if (minOrderMissing > 0) return false;
      if (!addressText.trim()) return false;
    }
    return true;
  }, [items.length, deliveryType, deliveryZone, minOrderMissing, addressText, customerName, customerPhone]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAddresses) {
      toast.error('Trebuie să fii conectat pentru a salva adrese.');
      return;
    }
    if (!newAddrCity.trim() || !newAddrAddress.trim()) {
      toast.error('Completează orașul și adresa.');
      return;
    }
    try {
      setCreatingAddress(true);
      const payload = {
        city: newAddrCity.trim(),
        address: newAddrAddress.trim(),
        label: newAddrLabel.trim() || null,
        is_default: newAddrDefault,
      };
      const res = await apiClient.createAddress(payload);

      // normalizează răspunsul
      const created: ClientAddress = {
        id: res.id ?? res.data?.id ?? Date.now(),
        city: res.city ?? res.data?.city ?? payload.city,
        address: res.address ?? res.data?.address ?? payload.address,
        label: res.label ?? res.data?.label ?? payload.label ?? null,
        is_default: Boolean(res.is_default ?? res.data?.is_default ?? false),
        lat: res.lat ?? null,
        lng: res.lng ?? null,
      };

      setAddresses(prev => [created, ...prev]);
      setSelectedAddressId(String(created.id));
      setAddressText(`${created.city}, ${created.address}`);
      setAddOpen(false);

      // reset form
      setNewAddrLabel('');
      setNewAddrCity('');
      setNewAddrAddress('');
      setNewAddrDefault(false);

      toast.success('Adresă adăugată');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Nu am putut salva adresa');
    } finally {
      setCreatingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) {
      toast.error('Completează detaliile comenzii.');
      return;
    }

    const backendPayload = {
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      address_id: selectedAddressId ? Number(selectedAddressId) : undefined,
      address_text: deliveryType === 'delivery' ? addressText.trim() : null,
      delivery_zone_id: deliveryZone ? Number(deliveryZone.id) : null,
      delivery_fee: deliveryFee,
      notes: notes.trim() ? notes.trim() : null,
      items: items.map(i => ({
        product_id: Number(i.product.id),
        quantity: i.quantity,
      })),
      discount: discount > 0 ? Number(discount) : 0,
      applied_offers: null,
    } as const;

    try {
      const resp = await apiClient.createOrder(backendPayload);

      const orderId = String(resp.id);
      const localOrder: LocalOrder = {
        id: orderId,
        createdAt: new Date().toISOString(),
        deliveryType,
        deliveryFee,
        subtotal,
        discount,
        total,
        paymentMethod,
        items: items.map(i => ({ product: i.product, quantity: i.quantity })),
        customerInfo: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: deliveryType === 'delivery' ? addressText.trim() : 'Ridicare din locație',
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      };
      localStorage.setItem('lastOrder', JSON.stringify(localOrder));

      clearCart();
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Nu am putut plasa comanda');
    }
  };

  if (loading) {
    return (
        <>
          <Header />
          <CartSheet />
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">⏳</div>
                <p>Se încarcă checkout-ul...</p>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </>
    );
  }

  return (
      <>
        <Header />
        <CartSheet />

        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stânga */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tip livrare */}
            <Card>
              <CardHeader>
                <CardTitle>Livrare sau ridicare</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                    value={deliveryType}
                    onValueChange={(v) => {
                      const type = v as 'delivery' | 'pickup';
                      setDeliveryType(type);
                      if (type === 'pickup') setDeliveryZone(null);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <Label className="border rounded-md p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="delivery" id="opt-delivery" />
                      <div>
                        <div className="font-medium">Livrare</div>
                        <div className="text-xs text-muted-foreground">
                          Taxa se calculează în funcție de zonă
                        </div>
                      </div>
                    </div>
                  </Label>

                  <Label className="border rounded-md p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="pickup" id="opt-pickup" />
                      <div>
                        <div className="font-medium">Ridicare</div>
                        <div className="text-xs text-muted-foreground">Gratis</div>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Adresă + zonă (doar livrare) */}
            {deliveryType === 'delivery' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adresa & Zona de livrare</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.length > 0 && (
                        <div className="space-y-2">
                          <Label>Adresă salvată</Label>
                          <Select
                              value={selectedAddressId}
                              onValueChange={(v) => setSelectedAddressId(v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează o adresă" />
                            </SelectTrigger>
                            <SelectContent>
                              {addresses.map((a) => (
                                  <SelectItem key={String(a.id)} value={String(a.id)}>
                                    {(a.label ? `${a.label} — ` : '') + `${a.city}, ${a.address}`}
                                    {a.is_default ? ' (implicită)' : ''}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Add address button (doar dacă e logat) */}
                          {canManageAddresses && (
                              <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setAddOpen(true)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Adaugă adresă nouă
                                </Button>
                              </div>
                          )}
                        </div>
                    )}

                    {!canManageAddresses && (
                        <div className="text-xs text-muted-foreground">
                          Te poți conecta pentru a salva adrese și a le selecta mai rapid.
                        </div>
                    )}

                    {/* Adresa (editabilă mereu) */}
                    <div className="space-y-2">
                      <Label>Adresă completă *</Label>
                      <Input
                          placeholder="Str. Mihai Viteazu nr. 15, bl. A2, ap. 12"
                          value={addressText}
                          onChange={(e) => setAddressText(e.target.value)}
                      />
                    </div>

                    {/* Zona */}
                    <div className="space-y-2">
                      <Label>Zonă de livrare *</Label>
                      <Select
                          value={deliveryZone ? String(deliveryZone.id) : ''}
                          onValueChange={(zoneId) => {
                            const z = zones.find(zz => String(zz.id) === String(zoneId)) || null;
                            if (z) {
                              setDeliveryZone({
                                id: z.id,
                                name: z.name,
                                deliveryFee: z.deliveryFee,
                                minOrder: z.minOrder,
                              });
                            } else {
                              setDeliveryZone(null);
                            }
                          }}
                      >
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

                    {deliveryZone && minOrderMissing > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                          Comandă minimă pentru zona <strong>{deliveryZone.name}</strong> este{' '}
                          <strong>{formatPrice(deliveryZone.minOrder)}</strong>. Mai adaugă{' '}
                          <strong>{formatPrice(minOrderMissing)}</strong> pentru a continua.
                        </div>
                    )}
                  </CardContent>
                </Card>
            )}

            {/* Date client */}
            <Card>
              <CardHeader>
                <CardTitle>Date de contact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nume *</Label>
                  <Input
                      placeholder="ex: Popescu Ion"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon *</Label>
                  <Input
                      placeholder="ex: 07xx xxx xxx"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observații (opțional)</Label>
                  <Input
                      placeholder="Instrucțiuni pentru livrare..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Metodă de plată */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Metodă de plată</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label
                      htmlFor="pay-cash"
                      className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                  >
                    <RadioGroupItem id="pay-cash" value="cash" />
                    <div className="flex items-center space-x-3 flex-1">
                      <Banknote className="w-6 h-6 text-[hsl(var(--primary))]" />
                      <div>
                        <p className="font-medium">Numerar</p>
                        <p className="text-sm text-muted-foreground">
                          Plată la {deliveryType === 'delivery' ? 'livrare' : 'ridicare'}
                        </p>
                      </div>
                    </div>
                  </Label>

                  <Label
                      htmlFor="pay-card"
                      className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                  >
                    <RadioGroupItem id="pay-card" value="card" />
                    <div className="flex items-center space-x-3 flex-1">
                      <CreditCard className="w-6 h-6 text-[hsl(var(--primary))]" />
                      <div>
                        <p className="font-medium">Card bancar</p>
                        <p className="text-sm text-muted-foreground">
                          POS la {deliveryType === 'delivery' ? 'livrare' : 'ridicare'}
                        </p>
                      </div>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Dreapta: sumar + editare produse */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sumar comandă</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((i) => (
                      <div key={i.product.id} className="flex items-center justify-between gap-3 p-3 border rounded-md">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{i.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPrice(i.product.price)} × {i.quantity} ={' '}
                            <span className="font-medium text-foreground">{formatPrice(i.product.price * i.quantity)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantity(i.product.id as any, i.quantity - 1)}
                              aria-label="Reduce cantitatea"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{i.quantity}</span>
                          <Button
                              variant="outline"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => updateQuantity(i.product.id as any, i.quantity + 1)}
                              aria-label="Mărește cantitatea"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-destructive"
                              onClick={() => removeItem(i.product.id as any)}
                              aria-label="Șterge produsul"
                              title="Șterge"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                  ))}
                  {items.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        Coșul este gol. <Link href="/meniu" className="underline">Adaugă produse</Link>.
                      </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
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
                    <span>
                    {deliveryType === 'pickup'
                        ? 'Gratuit'
                        : (deliveryZone ? formatPrice(deliveryZone.deliveryFee) : '—')}
                  </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={!canPlaceOrder}
                >
                  Plasează comanda
                </Button>

                <div className="text-xs text-muted-foreground">
                  {deliveryType === 'delivery' && !deliveryZone && 'Selectează zona pentru a vedea taxa de livrare.'}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Info</Badge>
                  <span>Taxa de livrare se calculează în funcție de zona selectată.</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Poți alege <strong>Ridicare</strong> pentru a evita taxa de livrare.</li>
                  <li>Respectă <strong>comanda minimă</strong> pentru livrare în zona aleasă.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog: Adaugă adresă */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adaugă adresă</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div className="space-y-2">
                <Label>Etichetă (opțional)</Label>
                <Input
                    placeholder="ex: Acasă, Birou"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Oraș *</Label>
                <Input
                    placeholder="ex: Năvodari"
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Adresă completă *</Label>
                <Input
                    placeholder="Str. Mihai Viteazu nr. 15, bl. A2, ap. 12"
                    value={newAddrAddress}
                    onChange={(e) => setNewAddrAddress(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                    checked={newAddrDefault}
                    onCheckedChange={(v) => setNewAddrDefault(Boolean(v))}
                    id="is-default"
                />
                <Label htmlFor="is-default">Setează ca implicită</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit" disabled={creatingAddress}>
                  {creatingAddress ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Footer />
      </>
  );
}
