'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Truck, 
  Store,
  MapPin,
  Phone,
  User,
  MessageSquare,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { formatPrice, generateOrderId } from '@/lib/format';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items, subtotal, discount, total, deliveryFee, clearCart } = useCartStore();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
      paymentMethod: 'cash',
      deliveryType: 'delivery',
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;

  const deliveryType = watch('deliveryType');
  const finalTotal = deliveryType === 'pickup' ? total - deliveryFee : total;

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error('Coșul este gol', {
        description: 'Adaugă produse pentru a continua cu comanda.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderId = generateOrderId();
      
      // Store order in localStorage for demo purposes
      const order = {
        id: orderId,
        items,
        customerInfo: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
        },
        paymentMethod: data.paymentMethod,
        deliveryType: data.deliveryType,
        subtotal,
        discount,
        total: finalTotal,
        createdAt: new Date(),
        status: 'pending' as const,
      };

      localStorage.setItem('lastOrder', JSON.stringify(order));
      
      // Clear cart
      clearCart();

      toast.success('Comandă plasată cu succes!', {
        description: `Comanda #${orderId} a fost înregistrată.`,
        duration: 4000,
      });

      // Redirect to success page
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      toast.error('Eroare la plasarea comenzii', {
        description: 'Te rugăm să încerci din nou în câteva momente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <CartSheet />
        
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="p-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-2xl font-bold mb-4">Coșul este gol</h2>
                <p className="text-muted-foreground mb-8">
                  Nu ai produse în coș. Adaugă preparate pentru a continua cu comanda.
                </p>
                <Button asChild size="lg">
                  <Link href="/meniu">
                    Explorează meniul
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
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-center">
              Finalizează comanda
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Informații client</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nume complet *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresă completă *</Label>
                      <Textarea
                        id="address"
                        {...register('address')}
                        placeholder="Strada, numărul, etaj, apartament, cod poștal, oraș"
                        className={errors.address ? 'border-destructive' : ''}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observații (opțional)</Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Instrucțiuni speciale pentru livrare, alergii, preferințe..."
                        rows={3}
                      />
                      {errors.notes && (
                        <p className="text-sm text-destructive">{errors.notes.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Tip livrare</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      {...register('deliveryType')}
                      defaultValue="delivery"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="delivery"
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                      >
                        <RadioGroupItem id="delivery" value="delivery" />
                        <div className="flex items-center space-x-3 flex-1">
                          <Truck className="w-6 h-6 text-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium">Livrare acasă</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(deliveryFee)} - 30-45 min
                            </p>
                          </div>
                        </div>
                      </Label>

                      <Label
                        htmlFor="pickup"
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                      >
                        <RadioGroupItem id="pickup" value="pickup" />
                        <div className="flex items-center space-x-3 flex-1">
                          <Store className="w-6 h-6 text-[hsl(var(--primary))]" />
                          <div>
                            <p className="font-medium">Ridicare din restaurant</p>
                            <p className="text-sm text-muted-foreground">
                              Gratuit - 15-20 min
                            </p>
                          </div>
                        </div>
                      </Label>
                    </RadioGroup>
                    {errors.deliveryType && (
                      <p className="text-sm text-destructive mt-2">{errors.deliveryType.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Metodă de plată</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      {...register('paymentMethod')}
                      defaultValue="cash"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="cash"
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                      >
                        <RadioGroupItem id="cash" value="cash" />
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
                        htmlFor="card"
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-[hsl(var(--primary))] has-[:checked]:bg-[hsl(var(--primary))]/5"
                      >
                        <RadioGroupItem id="card" value="card" />
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
                    {errors.paymentMethod && (
                      <p className="text-sm text-destructive mt-2">{errors.paymentMethod.message}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Sumar comandă</span>
                      <Badge variant="secondary">{items.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-3 pb-3 border-b border-border last:border-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.product.price)} × {item.quantity}
                            </p>
                          </div>
                          
                          <p className="font-semibold text-sm text-[hsl(var(--primary))]">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Order Totals */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Reducere:</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Livrare:</span>
                        <span>
                          {deliveryType === 'pickup' 
                            ? 'Gratuit' 
                            : formatPrice(deliveryFee)
                          }
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span className="text-[hsl(var(--primary))]">
                          {formatPrice(finalTotal)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Se procesează...' : 'Plasează comanda'}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Prin plasarea comenzii, accepți termenii și condițiile Sky Caffe.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </>
  );
}