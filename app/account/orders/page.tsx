// app/account/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api';
import { formatPrice } from '@/lib/format';

type OrderLite = {
    id: string | number;
    total_price: number;
    status: string;
    created_at: string;
};

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [orders, setOrders] = useState<OrderLite[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login?returnTo=/account/orders');
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                setLoadingList(true);
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
                setLoadingList(false);
            }
        })();
    }, [user]);
    if (!isClient) return null;

    return (
        <>
            <Header />
            <CartSheet />
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Comenzile mele</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingList && <div className="text-sm text-muted-foreground">Se încarcă...</div>}
                        {!loadingList && orders.length === 0 && (
                            <div className="text-sm text-muted-foreground">
                                Încă nu ai comenzi. <Link href="/meniu" className="underline">Vezi meniul</Link>.
                            </div>
                        )}
                        {orders.map((o) => (
                            <Link
                                key={String(o.id)}
                                href={`/account/orders/${o.id}`}
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                            >
                                <div className="space-y-1">
                                    <div className="font-medium">Comanda #{o.id}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="mb-1">{o.status}</Badge>
                                    <div className="font-medium">{formatPrice(o.total_price)}</div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
