'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  TrendingUp, ShoppingCart, Users, Star, Eye, Package, Gift,
} from 'lucide-react';
import { formatPrice, formatShortDate } from '@/lib/format';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types';
import apiClient from '@/lib/api';
import Can from "@/components/admin/Can";

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  preparing: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  delivered: 'bg-green-500/10 text-green-700 dark:text-green-400',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'În așteptare',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  delivered: 'Livrată',
};

type PopularProduct = {
  id: string | number;
  name: string;
  price: number;
  orders: number;
  revenue?: number;
  recommended?: boolean;
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[] | null>(null);
  const [popularLoading, setPopularLoading] = useState<boolean>(true);

  // Recent orders (refresh every 30s)
  useEffect(() => {
    const getRecentOrders = async () => {
      try {
        const response = await apiClient.getOrders({ page: 1, pageSize: 5 });
        setRecentOrders(response?.data ?? []);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      }
    };
    const interval = setInterval(getRecentOrders, 30000);
    getRecentOrders();
    return () => clearInterval(interval);
  }, []);

  // Products (for fallback + stats)
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

  // Popular products
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        setPopularLoading(true);
        // backend endpoint added in api client below
        const res = await apiClient.getPopularProducts({ limit: 5, days: 30 });
        // Expected shape: [{ id, name, price, orders, revenue?, recommended? }]
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
        // Fallback: pick recommended products and fake order counts (best effort)
        if (products && products.length > 0) {
          const fallback = products
              .filter(p => p.recommended)
              .slice(0, 5)
              .map((p, idx) => ({
                id: p.id,
                name: p.name,
                price: Number(p.price ?? 0),
                orders: 50 - idx * 5, // simple descending placeholder
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

  if (!products) return <div>Loading...</div>;

  const DEFAULT_STATUS_CLASS = 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  const DEFAULT_STATUS_LABEL = 'În așteptare';

  function getStatusClass(status: string): string {
    return statusColors[status as OrderStatus] ?? DEFAULT_STATUS_CLASS;
  }

  function getStatusLabel(status: string): string {
    return statusLabels[status as OrderStatus] ?? DEFAULT_STATUS_LABEL;
  }

  // Stats (mocked totals; you can wire these to analytics endpoints later)
  const stats = [
    { title: 'Venituri totale', value: '15,247 lei', change: '+12.5%', changeType: 'positive' as const, icon: TrendingUp },
    { title: 'Comenzi totale', value: '432', change: '+8.2%', changeType: 'positive' as const, icon: ShoppingCart },
    { title: 'Clienți unici', value: '287', change: '+15.3%', changeType: 'positive' as const, icon: Users },
    { title: 'Produse active', value: products.length.toString(), change: '+2', changeType: 'positive' as const, icon: Package },
  ];


  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bun venit în panoul de administrare Sky Caffe</p>
        </div>

        {/* Stats Cards */}
        <Can role="ADMIN">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className={`text-sm mt-1 ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change} vs luna trecută
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-[hsl(var(--primary))]/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comenzi recente</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/comenzi">
                  <Eye className="w-4 h-4 mr-2" />
                  Vezi toate
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comandă</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentOrders ?? []).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{order.id}</p>
                            <p className="text-xs text-muted-foreground">{formatShortDate(order.created_at || order.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{order.customer ?? order.customer_name ?? '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              {(order.items?.length ?? order.items ?? 0)} {(order.items?.length ?? order.items ?? 0) === 1 ? 'produs' : 'produse'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(order.total ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusClass(order.status ?? 'pending')}>
                            {getStatusLabel(order.status ?? 'pending')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          Nu există comenzi recente.
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Popular Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produse populare</CardTitle>
              {/*<Button variant="outline" size="sm" asChild>*/}
              {/*  <Link href="/admin/produse">*/}
              {/*    <Package className="w-4 h-4 mr-2" />*/}
              {/*    Gestionează*/}
              {/*  </Link>*/}
              {/*</Button>*/}
            </CardHeader>
            <CardContent>
              {popularLoading ? (
                  <div className="text-sm text-muted-foreground py-4">Se încarcă...</div>
              ) : displayPopular.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">Nu există date pentru produse populare.</div>
              ) : (
                  <div className="space-y-4">
                    {displayPopular.map((product, index) => (
                        <div key={product.id} className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-[hsl(var(--primary))]">#{index + 1}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <div className="flex items-center flex-wrap gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                {product.orders} comenzi
                                {typeof product.revenue === 'number' && (
                                    <> • venit {formatPrice(product.revenue)}</>
                                )}
                              </p>
                              {product.recommended && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Recomandat
                                  </Badge>
                              )}
                            </div>
                          </div>

                          <p className="font-semibold text-[hsl(var(--primary))]">
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
            <CardTitle>Acțiuni rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/produse">
                  <Package className="w-6 h-6 mb-2" />
                  Adaugă produs
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/oferte">
                  <Gift className="w-6 h-6 mb-2" />
                  Creează ofertă
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/recomandate">
                  <Star className="w-6 h-6 mb-2" />
                  Setează recomandate
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/meniu">
                  <Eye className="w-6 h-6 mb-2" />
                  Vizualizează site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
