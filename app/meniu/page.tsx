'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { ProductCard } from '@/components/product/product-card';
import { CategoryFilter } from '@/components/categories/category-filter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { Category, Product } from '@/types';

export default function MenuPage() {
  return (
      <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <p>Se încarcă meniul...</p>
            </div>
          }
      >
        <MenuPageContent />
      </Suspense>
  );
}

function MenuPageContent() {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategoryParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const HEADER_HEIGHT = 64;
  const BAR_HEIGHT = 56;
  const EXTRA_MARGIN = 16;
  const STICKY_OFFSET = HEADER_HEIGHT + BAR_HEIGHT;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          apiClient.getCategories({ client_page: 'delivery'}),
          apiClient.getProducts({ client_page: 'delivery'}),
        ]);

        setCategories(catRes.data);

        // Normalize: mark recommended from backend flag
        const normalized: Product[] = (prodRes.data || []).map((p: any) => ({
          ...p,
          recommended: Boolean(p.is_recommended_now),
        }));

        setProducts(normalized);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ----- Helpers -----
  const resolveCategoryId = useCallback(
      (value: string | null): string | null => {
        if (!value || value === 'all') return null;
        if (value === 'recommended') return 'recommended';
        const match = categories.find(
            (c) => String(c.id) === String(value) || c.slug === value
        );
        return match?.id ? String(match.id) : null;
      },
      [categories]
  );

  const selectedCategoryId = useMemo(
      () => resolveCategoryId(selectedCategory),
      [resolveCategoryId, selectedCategory]
  );

  // Search set
  const searchIds = useMemo(() => {
    if (!searchQuery.trim()) return null as Set<string> | null;
    const q = searchQuery.trim().toLowerCase();
    const matches = products.filter((p) => p.name.toLowerCase().includes(q));
    return new Set(matches.map((p) => p.id));
  }, [searchQuery, products]);

  // Counts (global)
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    let recommendedCount = 0;
    products.forEach((p) => {
      const key = String(p.category.id);
      counts[key] = (counts[key] || 0) + 1;
      if (p.recommended) recommendedCount += 1;
    });
    counts['recommended'] = recommendedCount;
    return counts;
  }, [products]);

  // Actual categories that have products (global)
  const categoriesWithProducts = useMemo(
      () => categories.filter((c) => (productCounts[String(c.id)] ?? 0) > 0),
      [categories, productCounts]
  );

  // Build groups (including pseudo "Recomandate" first)
  type GroupCat = { id: string; name: string; icon?: string };
  const recommendedCount = productCounts.recommended ?? 0;
  const recommendedCat = useMemo<GroupCat | null>(() => {
    return recommendedCount > 0
        ? { id: 'recommended', name: 'Recomandate', icon: 'star' }
        : null;
  }, [recommendedCount]);

  const grouped = useMemo(() => {
    const groups: { cat: GroupCat; items: Product[] }[] = [];

    // Pseudo "Recomandate" group first (only if we have any recommended)
    if (recommendedCat) {
      const recItems = products.filter(
          (p) => p.recommended && (!searchIds || searchIds.has(p.id))
      );
      groups.push({ cat: recommendedCat, items: recItems });
    }

    // Then real categories
    categoriesWithProducts.forEach((c) => {
      const items = products.filter(
          (p) =>
              String(p.category.id) === String(c.id) &&
              (!searchIds || searchIds.has(p.id))
      );
      groups.push({
        cat: { id: String(c.id), name: c.name, icon: (c as any).icon },
        items,
      });
    });

    return groups;
  }, [recommendedCat, products, categoriesWithProducts, searchIds]);

  // Only visible (when searching, hide groups without results)
  const visibleGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    return grouped.filter((g) => g.items.length > 0);
  }, [grouped, searchQuery]);

  // Active category id for UI: keep current if still visible; else fallback to first visible
  const activeCategoryIdForUI = useMemo(() => {
    const ids = visibleGroups.map((g) => g.cat.id);
    const resolved = selectedCategoryId ?? (ids.length ? ids[0] : '');
    if (resolved && ids.includes(resolved)) return resolved;
    return ids.length ? ids[0] : '';
  }, [visibleGroups, selectedCategoryId]);

  const clearSearch = () => setSearchQuery('');

  // Chips based on visible groups (follow filtered)
  const categoryChips = useMemo(
      () => visibleGroups.map((g) => ({ id: g.cat.id, name: g.cat.name })),
      [visibleGroups]
  );

  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<number | null>(null);

  const scrollToCategory = useCallback(
      (id: string) => {
        const el = document.getElementById(`cat-${id}`);
        if (!el) return;

        programmaticScrollRef.current = true;
        if (programmaticTimerRef.current) {
          window.clearTimeout(programmaticTimerRef.current);
        }
        programmaticTimerRef.current = window.setTimeout(() => {
          programmaticScrollRef.current = false;
        }, 500);

        const rect = el.getBoundingClientRect();
        const currentScroll = window.scrollY || window.pageYOffset;
        const targetY = currentScroll + rect.top - (STICKY_OFFSET + EXTRA_MARGIN);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      },
      [STICKY_OFFSET]
  );

  const handleSelectCategory = (value: string) => {
    setSelectedCategory(value);
    const id = resolveCategoryId(value) ?? (value === 'all' ? null : value);
    if (id) scrollToCategory(id);
  };

  // Ensure selectedCategory reflects query param once categories are loaded
  useEffect(() => {
    if (categories.length === 0) return;
    const resolvedId = resolveCategoryId(initialCategoryParam);
    if (resolvedId || initialCategoryParam === 'all') {
      setSelectedCategory(initialCategoryParam);
    }
  }, [categories, initialCategoryParam, resolveCategoryId]);

  // Sync active chip while scrolling (DOM order of visible sections)
  useEffect(() => {
    const sections = Array.from(
        document.querySelectorAll('section[id^="cat-"]')
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const onScroll = () => {
      if (programmaticScrollRef.current) return;

      let activeId: string | null = null;
      let bestDelta = Number.POSITIVE_INFINITY;

      sections.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        const delta = Math.abs(top - (STICKY_OFFSET + EXTRA_MARGIN));
        if (delta < bestDelta) {
          bestDelta = delta;
          activeId = el.id.replace('cat-', '');
        }
      });

      if (activeId && resolveCategoryId(selectedCategory) !== activeId) {
        setSelectedCategory(activeId);
        const chipEl = chipsContainerRef.current?.querySelector<HTMLButtonElement>(
            `[data-cat="${activeId}"]`
        );
        if (chipEl) {
          chipEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }
    };

    onScroll(); // initial
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [STICKY_OFFSET, selectedCategory, resolveCategoryId, visibleGroups]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Se încarcă meniul...</p>
        </div>
    );
  }

  return (
      <>
        <Header />
        <CartSheet />

        <div className="min-h-screen bg-background">
          {/* Hero */}
          <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] py-12">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Meniul nostru</h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Descoperă preparatele noastre delicioase, cu ingrediente proaspete și rețete autentice
              </p>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar (DESKTOP) */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Căutare</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                          type="text"
                          placeholder="Caută preparate..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10"
                      />
                      {searchQuery && (
                          <button
                              onClick={clearSearch}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop category list follows visible groups (incl. Recomandate) */}
                  <CategoryFilter
                      selectedCategory={activeCategoryIdForUI}
                      onCategoryChange={handleSelectCategory}
                      productCounts={productCounts}
                      categories={visibleGroups.map((g) => ({
                        id: g.cat.id,
                        name: g.cat.name,
                        icon: g.cat.id === 'recommended' ? 'star' : (g.cat as any).icon,
                      }))}
                  />
                </div>
              </aside>

              {/* Main */}
              <main className="flex-1">
                {/* Mobile category chips (visible groups incl. Recomandate) */}
                <div className="lg:hidden sticky-under-header -mx-4 px-4 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                  <div
                      ref={chipsContainerRef}
                      className="flex items-stretch gap-2 overflow-x-auto py-2 hide-scrollbar snap-x snap-mandatory"
                  >
                    {categoryChips.map((cat) => {
                      const isActive = activeCategoryIdForUI === String(cat.id);
                      const count = productCounts[String(cat.id)] ?? 0;

                      return (
                          <button
                              key={cat.id}
                              type="button"
                              data-cat={cat.id}
                              onClick={() => handleSelectCategory(String(cat.id))}
                              className={[
                                'snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-input hover:bg-muted',
                              ].join(' ')}
                          >
                            <span>{cat.name}</span>
                            <span
                                className={[
                                  'ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px]',
                                  isActive ? 'bg-primary-foreground/20' : 'text-muted-foreground',
                                ].join(' ')}
                            >
                          {count}
                        </span>
                          </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sections (Recomandate first if present) */}
                <div className="space-y-10">
                  {grouped.map(({ cat, items }) => {
                    if (searchQuery.trim() && items.length === 0) return null;

                    return (
                        <section
                            key={cat.id}
                            id={`cat-${cat.id}`}
                            style={{
                              scrollMarginTop: `calc(${HEADER_HEIGHT}px + ${BAR_HEIGHT}px + ${EXTRA_MARGIN}px)`,
                            }}
                        >
                          <div className="flex items-center mb-4 gap-2">
                            <h3 className="text-xl font-semibold">{cat.name}</h3>
                            <Badge variant="secondary">
                              {productCounts[String(cat.id)] ?? 0}
                            </Badge>
                          </div>

                          {items.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {items.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        showCategory={cat.id !== 'recommended'} // hide category label in Recomandate
                                        className="animate-fade-in"
                                    />
                                ))}
                              </div>
                          ) : null}
                        </section>
                    );
                  })}

                  {searchQuery.trim() && visibleGroups.every((g) => g.items.length === 0) && (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2">Nu am găsit preparate</h3>
                        <p className="text-muted-foreground mb-6">
                          Nu avem preparate care să conțină „{searchQuery}”.
                        </p>
                        <Button onClick={clearSearch}>Resetează căutarea</Button>
                      </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>

        <Footer />
      </>
  );
}
