// app/account/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {Eye, EyeOff} from "lucide-react";

type OrderLite = {
    id: string | number;
    total_price: number;
    status: string;
    created_at: string;
};

export default function AccountPage() {
    const router = useRouter();
    const { user, loading, updateUser } = useAuth();

    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState((user as any)?.phone || '');
    const [password, setPassword] = useState('');
    const [orders, setOrders] = useState<OrderLite[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login?returnTo=/account');
        }
    }, [loading, user, router]);

    useEffect(() => {
        setName(user?.name || '');
        setPhone((user as any)?.phone || '');
    }, [user]);

    // ultimele comenzi
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                setLoadingOrders(true);
                const res = await apiClient.getMyOrders();
                const list: OrderLite[] = (Array.isArray(res) ? res : res?.data || []).map((o: any) => ({
                    id: o.id,
                    total_price: Number(o.total_price ?? o.total ?? 0),
                    status: o.status || 'pending',
                    created_at: o.created_at || o.createdAt,
                }));
                setOrders(list);
            } catch {
                setOrders([]);
            } finally {
                setLoadingOrders(false);
            }
        })();
    }, [user]);

    const canSave = useMemo(
        () => !!name.trim() && !saving,
        [name, saving]
    );

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { name: name.trim(), phone: phone.trim() || null, password: password || undefined };
            const updated = await apiClient.updateProfile(payload);
            updateUser({ name: updated?.user?.name ?? payload.name, phone: updated?.user?.phone ?? payload.phone });
            toast.success('Profil actualizat');
        } catch (e: any) {
            toast.error(e?.message || 'Nu am putut salva profilul');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <>
                <Header />
                <CartSheet />
                <div className="container mx-auto px-4 py-12">
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">
                            <div className="text-5xl mb-4">⏳</div>
                            <p>Se încarcă contul...</p>
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
                {/* Profil */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Profil</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nume</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Popescu Ion" />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" inputMode="tel" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="password">Parola</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Introdu parola"
                                    autoComplete="current-password"
                                    className={`pr-10`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Ascunde parola' : 'Afișează parola'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <Button onClick={handleSave} disabled={!canSave}>
                                {saving ? 'Se salvează...' : 'Salvează'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick links */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acțiuni rapide</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/account/addresses">
                                <Button className="w-full mb-2" variant="outline">Gestionează adrese</Button>
                            </Link>
                            <Link href="/account/orders">
                                <Button className="w-full" variant="outline">Vezi comenzile</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Ultimele comenzi */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ultimele comenzi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loadingOrders && <div className="text-sm text-muted-foreground">Se încarcă...</div>}
                            {!loadingOrders && orders.length === 0 && (
                                <div className="text-sm text-muted-foreground">Nu ai comenzi încă.</div>
                            )}
                            {orders.slice(0, 3).map((o) => (
                                <Link key={String(o.id)} href={`/account/orders/${o.id}`} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Comanda #{o.id}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="mb-1">{o.status}</Badge>
                                        <div className="font-medium">{formatPrice(o.total_price)}</div>
                                    </div>
                                </Link>
                            ))}
                            {orders.length > 0 && (
                                <Link href="/account/orders" className="text-sm underline text-primary">Vezi toate</Link>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}
