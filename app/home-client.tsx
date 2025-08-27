'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid3X3, Star } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { toast } from 'sonner';
import type { Category, Product } from '@/types';

const categoryIcons = {
    grid: Grid3X3,
    // adaugă aici alte icon-uri după nevoie: pizza: Pizza, burger: Burger, etc.
} as const;

export function HomeClient() {
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [popularCategories, setPopularCategories] = useState<Category[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [loadingCats, setLoadingCats] = useState(true);

    // ————— Categorii populare
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const response = await apiClient.getPopularCategories();
                const cats: Category[] = Array.isArray((response as any)?.data)
                    ? (response as any).data
                    : (Array.isArray(response) ? (response as any) : []);
                if (isMounted) setPopularCategories(cats);
            } catch {
                toast.error('Eroare la încărcarea categoriilor');
            } finally {
                if (isMounted) setLoadingCats(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    // ————— Recomandate (1 produs recomandat / categorie, unice)
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const catsRes = await apiClient.getCategories({ page: 1, pageSize: 1000 });
                const categories: Category[] = Array.isArray((catsRes as any)?.data)
                    ? (catsRes as any).data
                    : (Array.isArray(catsRes) ? (catsRes as any) : []);

                if (!Array.isArray(categories) || categories.length === 0) {
                    if (isMounted) setRecommendedProducts([]);
                    return;
                }

                const settled = await Promise.allSettled(
                    categories.map((c) => apiClient.getActiveRecommendation({ category_id: c.id }))
                );

                const prods: Product[] = [];
                for (const s of settled) {
                    if (s.status === 'fulfilled') {
                        const data = (s.value as any)?.data ?? null;
                        if (!data) continue;
                        if ((data as any).product) prods.push((data as any).product as Product);
                        else if ((data as any).id && (data as any).name) prods.push(data as Product);
                    }
                }

                // unice după id
                const uniq = Array.from(new Map(prods.map((p) => [p.id, p])).values());
                if (isMounted) setRecommendedProducts(uniq);
            } catch {
                toast.error('Eroare la încărcarea produselor recomandate');
                if (isMounted) setRecommendedProducts([]);
            } finally {
                if (isMounted) setLoadingRecs(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            {/* Categorii: afișează secțiunea fie când încărcăm, fie când avem date */}
            {(loadingCats || popularCategories.length > 0) && (
                <section
                    className="py-16 bg-gradient-to-b from-background to-muted/20 min-h-[60vh]"
                    aria-labelledby="categories-heading"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '800px' }}
                >
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 id="categories-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                                Categorii <span className="text-[hsl(var(--primary))]">populare</span>
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Descoperă varietatea noastră de preparate, de la pizza artizanală la deserturi rafinate
                            </p>
                        </header>

                        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" aria-label="Categorii populare">
                            {loadingCats ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <li key={i} aria-busy="true">
                                        <Card className="h-full">
                                            <CardContent className="p-6 text-center">
                                                <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
                                                <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
                                                <Skeleton className="h-3 w-full" />
                                            </CardContent>
                                        </Card>
                                    </li>
                                ))
                            ) : (
                                popularCategories.map((category) => {
                                    const Icon =
                                        (category.icon && (categoryIcons as any)[category.icon]) ||
                                        categoryIcons.grid;
                                    return (
                                        <li key={category.id}>
                                            <Link href={`/meniu?category=${category.id}`} aria-describedby={`category-${category.id}-description`}>
                                                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full focus-within:ring-2 focus-within:ring-[hsl(var(--primary))] focus-within:ring-offset-2">
                                                    <CardContent className="p-6 text-center">
                                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/20 transition-colors">
                                                            <Icon className="w-8 h-8 text-[hsl(var(--primary))]" aria-hidden="true" />
                                                        </div>
                                                        <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                                                        <p id={`category-${category.id}-description`} className="text-muted-foreground text-sm line-clamp-2">
                                                            {category.description}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                </section>
            )}

            {/* Recomandate */}
            {(recommendedProducts.length > 0 || loadingRecs) && (
                <section
                    className="py-16 min-h-[80vh] bg-muted/20"
                    aria-labelledby="recommended-heading"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}
                >
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" aria-hidden="true" />
                                <h2 id="recommended-heading" className="text-3xl lg:text-4xl font-bold">
                                    Preparate <span className="text-[hsl(var(--accent))]">recomandate</span>
                                </h2>
                                <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" aria-hidden="true" />
                            </div>
                            <p className="text-[hsl(222_12%_40%)] text-lg max-w-2xl mx-auto">
                                Preparatele noastre cele mai apreciate, selectate special pentru tine
                            </p>
                        </header>

                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" aria-label="Preparate recomandate">
                            {loadingRecs
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <li key={i} aria-busy="true">
                                        <Card>
                                            <CardContent className="p-0">
                                                <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                                                <div className="p-4 space-y-3">
                                                    <Skeleton className="h-6 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                    <Skeleton className="h-4 w-full" />
                                                    <Skeleton className="h-10 w-full" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </li>
                                ))
                                : recommendedProducts.map((product) => (
                                    <li key={product.id}>
                                        <ProductCard product={product} showCategory className="animate-fade-in" />
                                    </li>
                                ))}
                        </ul>

                        {recommendedProducts.length > 0 && !loadingRecs && (
                            <div className="text-center">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 hover:from-[hsl(var(--primary))]/90 hover:to-[hsl(var(--primary))]/70"
                                >
                                    <Link href="/meniu" prefetch={false}>
                                        Vezi toate preparatele
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}

export default HomeClient;
