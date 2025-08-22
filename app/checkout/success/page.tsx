'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  CreditCard,
  Package,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';
import Link from 'next/link';
import { Order } from '@/types';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) {
      const lastOrder = localStorage.getItem('lastOrder');
      if (lastOrder) {
        const orderData = JSON.parse(lastOrder);
        if (orderData.id === orderId) {
          setOrder({
            ...orderData,
            createdAt: new Date(orderData.createdAt),
          });
        }
      }
    }
  }, [orderId]);

  if (!order || !orderId) {
    return (
      <>
        <Header />
        <CartSheet />
        
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="p-12">
                <div className="text-6xl mb-6">❓</div>
                <h2 className="text-2xl font-bold mb-4">Comandă negăsită</h2>
                <p className="text-muted-foreground mb-8">
                  Nu am găsit informații despre această comandă.
                </p>
                <Button asChild size="lg">
                  <Link href="/">
                    Înapoi la pagina principală
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <CartSheet />
      
      <div className="min-h-screen bg-background">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-fade-in">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                Comandă plasată cu succes!
              </h1>
              <p className="text-xl opacity-90">
                Comanda #{orderId} a fost înregistrată
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Order Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Statusul comenzii
                    </h2>
                    <p className="text-muted-foreground">
                      Comandă plasată la {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                    În așteptare
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-medium">Timp estimat</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryType === 'delivery' ? '30-45 min' : '15-20 min'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-medium">
                        {order.deliveryType === 'delivery' ? 'Livrare' : 'Ridicare'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryType === 'delivery' 
                          ? order.customerInfo.address 
                          : 'Sky Caffe - Rooftop etaj 4'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-medium">Metodă plată</p>
                      <p className="text-sm text-muted-foreground">
                        {order.paymentMethod === 'cash' ? 'Numerar' : 'Card bancar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div>
                      <p className="font-medium">Contact</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerInfo.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Informații client</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nume:</span>
                    <span className="font-medium">{order.customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefon:</span>
                    <span className="font-medium">{order.customerInfo.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adresă:</span>
                    <span className="font-medium text-right max-w-xs">
                      {order.customerInfo.address}
                    </span>
                  </div>
                  {order.customerInfo.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Observații:</span>
                      <span className="font-medium text-right max-w-xs">
                        {order.customerInfo.notes}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Produse comandate</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-[hsl(var(--primary))]">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Reducere:</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Livrare:</span>
                    <span>
                      {order.deliveryType === 'pickup' 
                        ? 'Gratuit' 
                        : formatPrice(10)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total:</span>
                    <span className="text-[hsl(var(--primary))]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/20">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-lg mb-4">
                  Ai întrebări despre comandă?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Suntem aici să te ajutăm! Nu ezita să ne contactezi.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="default">
                    <Link href="tel:0751123456">
                      <Phone className="w-4 h-4 mr-2" />
                      Sună acum
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">
                      Înapoi acasă
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}