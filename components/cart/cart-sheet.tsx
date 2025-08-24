'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export function CartSheet() {
  const {
    items, isOpen, itemCount, subtotal, discount, total,
    deliveryType, deliveryZone,
    updateQuantity, removeItem, closeCart
  } = useCartStore();

  const deliveryLabel =
      deliveryType === 'pickup'
          ? 'Gratuit'
          : (deliveryZone
              ? formatPrice(deliveryZone.deliveryFee)
              : '— (se calculează la checkout)');

  return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Coșul tău</span>
              {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {itemCount} {itemCount === 1 ? 'produs' : 'produse'}
                  </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <ShoppingCart className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-lg">Coșul este gol</h3>
                  <p className="text-muted-foreground text-sm">Adaugă produse pentru a continua</p>
                </div>
                <Button asChild onClick={closeCart}>
                  <Link href="/meniu">Explorează meniul</Link>
                </Button>
              </div>
          ) : (
              <>
                {/* Items */}
                <div className="flex-1 overflow-y-auto space-y-4">
                  {items.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-4 bg-card p-4 rounded-lg">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {item.product.description}
                          </p>
                          <p className="font-semibold text-sm mt-2 text-primary">
                            {formatPrice(item.product.price)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.product.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>

                          <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-6 h-6"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-6 h-6"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-border pt-4 space-y-4">
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
                      <span>{deliveryLabel}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full" size="lg" onClick={closeCart}>
                    <Link href="/checkout">Finalizează comanda</Link>
                  </Button>
                </div>
              </>
          )}
        </SheetContent>
      </Sheet>
  );
}
