'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ShoppingCart, Sun, Moon, Menu, X, LogOut, User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { formatPrice } from '@/lib/format';

type CartState = ReturnType<typeof useCartStore.getState>;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const itemCount         = useCartStore((s: CartState) => s.itemCount);
  const openCart          = useCartStore((s: CartState) => s.openCart);
  const getOfferHints     = useCartStore((s: CartState) => s.getOfferHints);
  const refreshOffers     = useCartStore((s: CartState) => s.refreshOffers);
  const offersInitialized = useCartStore((s: CartState) => s.offersInitialized);
  const offersLoading     = useCartStore((s: CartState) => s.offersLoading);

  // 👇 nou pentru mesaj reducere aplicată
  const discount          = useCartStore((s: CartState) => s.discount);
  const getAppliedOffers  = useCartStore((s: CartState) => s.getAppliedOffers);

  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!offersInitialized && !offersLoading) {
      refreshOffers().catch(() => {});
    }
  }, [offersInitialized, offersLoading, refreshOffers]);

  useEffect(() => setMounted(true), []);

  const hints = mounted ? getOfferHints() : [];
  const applied = mounted ? getAppliedOffers() : [];
  const hasDiscount = mounted && discount > 0 && applied.length > 0;

  // --- user dropdown: hover-open with close delay + no gap
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openNow = () => {
    clearCloseTimer();
    setUserMenuOpen(true);
  };
  const closeSoon = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setUserMenuOpen(false), 200);
  };

  const navItems = [
    { href: '/', label: 'Acasă' },
    { href: '/meniu', label: 'Meniu' },
    { href: '/despre', label: 'Despre' },
  ];

  return (
      <header
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
          style={{ ['--site-header-height' as any]: '64px' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent hover:opacity-90 transition-opacity"
            >
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
              {/* Theme */}
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-9 h-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Schimbă tema</span>
              </Button>

              {/* User icon + dropdown (desktop) */}
              {mounted && !loading && (
                  <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="w-9 h-9"
                          onMouseEnter={openNow}
                          onMouseLeave={closeSoon}
                          aria-label="Meniu utilizator"
                      >
                        <UserIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="center"
                        sideOffset={-5}
                        onMouseEnter={openNow}
                        onMouseLeave={closeSoon}
                        className="w-56"
                    >
                      {user ? (
                          <>
                            <DropdownMenuLabel className="truncate">
                              {user.name || user.email}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href="/account">
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Contul meu
                              </DropdownMenuItem>
                            </Link>
                            <Link href="/account/orders">
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Comenzile mele
                              </DropdownMenuItem>
                            </Link>
                            <Link href="/account/addresses">
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Adresele mele
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => logout()}
                            >
                              <LogOut className="w-4 h-4 mr-2" />
                              Delogare
                            </DropdownMenuItem>
                          </>
                      ) : (
                          <>
                            <Link href="/auth/login">
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Autentificare
                              </DropdownMenuItem>
                            </Link>
                            <Link href="/auth/register">
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Înregistrare
                              </DropdownMenuItem>
                            </Link>
                          </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
              )}

              {/* Cart */}
              <Button variant="ghost" size="icon" onClick={openCart} className="w-9 h-9 relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-slide-up">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
                )}
                <span className="sr-only">Coș cumpărături</span>
              </Button>

              {/* Mobile burger */}
              <Button variant="ghost" size="icon" className="md:hidden w-9 h-9" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Meniu</span>
              </Button>
            </div>
          </div>

          {/* Mobile nav */}
          <div
              className={cn(
                  'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
                  isMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
              )}
          >
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

              {/* mobile auth actions */}
              {mounted && !loading && (
                  user ? (
                      <div className="flex flex-col gap-2 px-4">
                        <Link href="/account" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Contul meu</Button>
                        </Link>
                        <Link href="/account/orders" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Comenzile mele</Button>
                        </Link>
                        <Link href="/account/addresses" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Adresele mele</Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => { logout(); setIsMenuOpen(false); }}
                        >
                          Delogare
                        </Button>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-2 px-4">
                        <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                          <Button variant="outline" className="w-full">Autentificare</Button>
                        </Link>
                        <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                          <Button className="w-full">Înregistrare</Button>
                        </Link>
                      </div>
                  )
              )}
            </nav>
          </div>
        </div>

        {/* Offer hints */}
        {hints.length > 0 && (
            <div className="space-y-2 text-center px-4 mt-2 mb-1">
              {hints.map((h) => (
                  <div
                      key={h.code}
                      className={`rounded-md border ${h.success ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'} px-3 py-2 text-sm`}
                  >
                    {h.message} {h.success && hasDiscount && (
                      <>
                        <strong>Reducere aplicată</strong>:{" "}
                        <span className="font-semibold">-{formatPrice(discount)}</span>
                      </>
                  )}
                  </div>
              ))}
            </div>
        )}
      </header>
  );
}
