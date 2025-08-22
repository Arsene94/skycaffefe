'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp,
  ShoppingCart,
  Users,
  Star,
  Eye,
  Package,
  Gift,
} from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice, formatShortDate } from '@/lib/format';
import Link from 'next/link';

// Mock data pentru statistici
const stats = [
  {
    title: 'Venituri totale',
    value: '15,247 lei',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
  {
    title: 'Comenzi totale',
    value: '432',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
  },
  {
    title: 'Clienți unici',
    value: '287',
    change: '+15.3%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'Produse active',
    value: products.length.toString(),
    change: '+2',
    changeType: 'positive' as const,
    icon: Package,
  },
];

// Mock comenzi recente
const recentOrders = [
  {
    id: 'SKY001234',
    customer: 'Maria Popescu',
    items: 3,
    total: 87.50,
    status: 'delivered' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
  },
  {
    id: 'SKY001235',
    customer: 'Ion Georgescu',
    items: 2,
    total: 65.00,
    status: 'preparing' as const,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30min ago
  },
  {
    id: 'SKY001236',
    customer: 'Ana Munteanu',
    items: 5,
    total: 142.30,
    status: 'confirmed' as const,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15min ago
  },
  {
    id: 'SKY001237',
    customer: 'Mihai Stoica',
    items: 1,
    total: 28.00,
    status: 'pending' as const,
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5min ago
  },
];

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  preparing: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  delivered: 'bg-green-500/10 text-green-700 dark:text-green-400',
};

const statusLabels = {
  pending: 'În așteptare',
  confirmed: 'Confirmată',
  preparing: 'În pregătire',
  delivered: 'Livrată',
};

// Produse populare
const popularProducts = products
  .filter(p => p.recommended)
  .slice(0, 5)
  .map(product => ({
    ...product,
    orders: Math.floor(Math.random() * 50) + 10,
  }))
  .sort((a, b) => b.orders - a.orders);

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bun venit în panoul de administrare Sky Caffe
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}
                    </p>
                    <p className={`text-sm mt-1 ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
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
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(order.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{order.customer}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items} {order.items === 1 ? 'produs' : 'produse'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={statusColors[order.status]}
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produse populare</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/produse">
                <Package className="w-4 h-4 mr-2" />
                Gestionează
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[hsl(var(--primary))]">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {product.orders} comenzi
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