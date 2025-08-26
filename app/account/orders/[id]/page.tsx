// app/account/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api';
import { formatPrice } from '@/lib/format';

type OrderItem = {
    product: { id: string | number; name: string; price: number };
    quantity: number;
};

type OrderFull = {
    id: string | number;
    status: string;
    created_at: string;
    subtotal: number;
    discount: number;
    delivery_fee: number;
    total_price: number;
    delivery_type: 'delivery' | 'pickup';
    payment_method: 'cash' | 'card' | string;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string | null;
    items: OrderItem[];
};

export default function OrderDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { user, loading } = useAuth();

    const [order, setOrder] = useState<OrderFull | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (!loading && !user) {
            router.replace(`/auth/login?returnTo=/account/orders/${params.id}`);
        }
    }, [loading, user, params.id, router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                setLoadingOrder(true);
                const o = await apiClient.getOrder(params.id);
                setOrder({
                    id: o.id,
                    status: o.status,
                    created_at: o.created_at || o.createdAt,
                    subtotal: Number(o.subtotal ?? 0),
                    discount: Number(o.discount ?? 0),
                    delivery_fee: Number(o.delivery_fee ?? 0),
                    total_price: Number(o.total_price ?? o.total ?? 0),
                    delivery_type: o.delivery_type || 'delivery',
                    payment_method: o.payment_method || 'cash',
                    customer_name: o.customer_name,
                    customer_phone: o.customer_phone,
                    customer_address: o.customer_address,
                    items: (o.items || []).map((it: any) => ({
                        product: {
                            id: it.product?.id ?? it.product_id,
                            name: it.product?.name ?? it.name,
                            price: Number(it.product?.price ?? it.price ?? 0),
                        },
                        quantity: Number(it.quantity ?? 1),
                    })),
                });
            } catch {
                setOrder(null);
            } finally {
                setLoadingOrder(false);
            }
        })();
    }, [user, params.id]);
    if (!isClient) return null;

    return (
        <>
            <Header />
            <CartSheet />
            <div className="container mx-auto px-4 py-8">
                {loadingOrder && (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">Se încarcă comanda...</CardContent>
                    </Card>
                )}

                {!loadingOrder && !order && (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">Comandă negăsită.</CardContent>
                    </Card>
                )}

                {order && (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Comanda #{order.id}</CardTitle>
                            <Badge variant="secondary">{order.status}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Data</div>
                                    <div className="font-medium">{new Date(order.created_at).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Plată</div>
                                    <div className="font-medium">{order.payment_method === 'cash' ? 'Numerar' : 'Card'}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Tip</div>
                                    <div className="font-medium">{order.delivery_type === 'delivery' ? 'Livrare' : 'Ridicare'}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Contact</div>
                                    <div className="font-medium">{order.customer_name} — {order.customer_phone}</div>
                                </div>
                                {order.delivery_type === 'delivery' && (
                                    <div className="md:col-span-2">
                                        <div className="text-muted-foreground">Adresă</div>
                                        <div className="font-medium">{order.customer_address}</div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="font-semibold">Produse</div>
                                {order.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="truncate">
                                            {it.product.name} <span className="text-muted-foreground">× {it.quantity}</span>
                                        </div>
                                        <div className="font-medium">{formatPrice(it.product.price * it.quantity)}</div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Reducere</span>
                                        <span>-{formatPrice(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Livrare</span>
                                    <span>{formatPrice(order.delivery_fee)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span className="text-primary">{formatPrice(order.total_price)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
            <Footer />
        </>
    );
}
