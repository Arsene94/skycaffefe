'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart'

type CartState = ReturnType<typeof useCartStore.getState>

export function CartButton() {
    const itemCount = useCartStore((s: CartState) => s.itemCount)
    const openCart  = useCartStore((s: CartState) => s.openCart)

    return (
        <Button variant="ghost" size="icon" className="w-9 h-9 relative" onClick={openCart} aria-label="Coș cumpărături">
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
            )}
        </Button>
    )
}
