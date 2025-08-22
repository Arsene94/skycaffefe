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
  // Wrap componentul care folosește useSearchParams în Suspense
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
          apiClient.getCategories(),
          apiClient.getProducts(),
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const resolveCategoryId = useCallback(
      (value: string | null): string | null => {
        if (!value || value === 'all') return null;
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

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'Toate preparatele';
    const cat = categories.find((c) => String(c.id) === selectedCategoryId);
    return cat?.name ?? 'Categorie';
  }, [selectedCategoryId, categories]);

  const searchIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim().toLowerCase();
    const matches = products.filter((p) => p.name.toLowerCase().includes(query));
    return new Set(matches.map((p) => p.id));
  }, [searchQuery, products]);

  const grouped = useMemo(() => {
    return categories.map((cat) => {
      const items = products.filter(
          (p) => String(p.category.id) === String(cat.id) && (!searchIds || searchIds.has(p.id))
      );
      return { cat, items };
    });
  }, [categories, products, searchIds]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      const key = String(p.category.id);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const clearSearch = () => setSearchQuery('');

  const categoryChips = useMemo(() => {
    return [...categories.map((c) => ({ id: c.id, name: c.name }))];
  }, [categories]);

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

  // Setează selectedCategory doar după ce categoriile sunt încărcate (pentru că poate fi slug)
  useEffect(() => {
    if (categories.length === 0) return;
    const resolvedId = resolveCategoryId(initialCategoryParam);
    if (resolvedId || initialCategoryParam === 'all') {
      setSelectedCategory(initialCategoryParam);
    }
  }, [categories, initialCategoryParam, resolveCategoryId]);

  // Observer pe scroll – folosește ordinea DOM ca să nu depindă de sortări
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

    onScroll(); // inițial
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [STICKY_OFFSET, selectedCategory, resolveCategoryId]);

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
              {/* Sidebar */}
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

                  <CategoryFilter
                      selectedCategory={selectedCategoryId ?? 'all'}
                      onCategoryChange={handleSelectCategory}
                      productCounts={productCounts}
                      categories={[
                        { id: 'all', name: 'Toate', icon: 'grid' },
                        ...categories.map((c) => ({
                          id: c.id,
                          name: c.name,
                          icon: (c as any).icon, // păstrează dacă ai icon
                        })),
                      ]}
                  />
                </div>
              </aside>

              {/* Main */}
              <main className="flex-1">
                {/* Mobile category chips */}
                <div className="lg:hidden sticky-under-header -mx-4 px-4 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                  <div
                      ref={chipsContainerRef}
                      className="flex items-stretch gap-2 overflow-x-auto py-2 hide-scrollbar snap-x snap-mandatory"
                  >
                    {categoryChips.map((cat) => {
                      const isActive = resolveCategoryId(selectedCategory) === String(cat.id);
                      const count =
                          (productCounts as any)[cat.id] ?? 0;

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
                                  isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                                ].join(' ')}
                            >
                          {count}
                        </span>
                          </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de produse */}
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
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">{cat.name}</h3>
                            <Badge variant="secondary">{productCounts[String(cat.id)] ?? 0}</Badge>
                          </div>

                          {items.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {items.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        showCategory={false}
                                        className="animate-fade-in"
                                    />
                                ))}
                              </div>
                          ) : (
                              <div className="rounded border text-muted-foreground p-6 text-sm">
                                Nu există produse în această categorie momentan.
                              </div>
                          )}
                        </section>
                    );
                  })}

                  {searchQuery.trim() && grouped.every((g) => g.items.length === 0) && (
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
