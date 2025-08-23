// components/layout/header.tsx
'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ShoppingCart, Sun, Moon, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';

type CartState = ReturnType<typeof useCartStore.getState>;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const itemCount        = useCartStore((s: CartState) => s.itemCount);
  const openCart         = useCartStore((s: CartState) => s.openCart);
  const getOfferHints    = useCartStore((s: CartState) => s.getOfferHints);
  const refreshOffers    = useCartStore((s: CartState) => s.refreshOffers);
  const offersInitialized= useCartStore((s: CartState) => s.offersInitialized);
  const offersLoading    = useCartStore((s: CartState) => s.offersLoading);

  // ▶️ încarcă ofertele la montare dacă nu sunt deja încărcate
  useEffect(() => {
    if (!offersInitialized && !offersLoading) {
      refreshOffers().catch(() => {/* noop */});
    }
  }, [offersInitialized, offersLoading, refreshOffers]);

  const hints = getOfferHints();

  const navItems = [
    { href: '/', label: 'Acasă' },
    { href: '/meniu', label: 'Meniu' },
    { href: '/despre', label: 'Despre' },
  ];

  return (
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
              style={{ ['--site-header-height' as any]: '64px' }}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent hover:opacity-90 transition-opacity">
              Sky Caffe
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="text-foreground/80 hover:text-primary transition-colors font-medium">
                    {item.label}
                  </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Schimbă tema</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={openCart} className="w-9 h-9 relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-slide-up">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
                )}
                <span className="sr-only">Coș cumpărături</span>
              </Button>

              <Button variant="ghost" size="icon" className="md:hidden w-9 h-9" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Meniu</span>
              </Button>
            </div>
          </div>

          <div className={cn("md:hidden overflow-hidden transition-all duration-300 ease-in-out", isMenuOpen ? "max-h-48 pb-4" : "max-h-0")}>
            <nav className="flex flex-col space-y-4 pt-4 border-t border-border">
              {navItems.map((item) => (
                  <Link
                      key={item.href}
                      href={item.href}
                      className="text-foreground/80 hover:text-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
              ))}
            </nav>
          </div>
        </div>

        {hints.length > 0 && (
            <div className="space-y-2 text-center">
              {hints.map(h => (
                  <div key={h.code} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
                    {h.message}
                  </div>
              ))}
            </div>
        )}
      </header>
  );
}
