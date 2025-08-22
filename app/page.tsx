'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Star,
  Clock,
  MapPin,
  Phone,
  Pizza,
  UtensilsCrossed,
  ChefHat,
  Leaf,
  Cake,
  Coffee,
  Quote, Grid3X3, Utensils, Apple, Wine, Barrel, Beer, GlassWater, Hamburger, Shrimp, Fish, Beef, CookingPot,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect, useState} from "react";
import {Category, Product} from "@/types";
import apiClient from "@/lib/api";
import {toast} from "sonner";

const categoryIcons = {
  pizza: Pizza, utensils: UtensilsCrossed, chefhat: ChefHat, leaf: Leaf, cake: Cake,
  coffee: Coffee, grid: Grid3X3, utensilsalt: Utensils, apple: Apple, wine: Wine,
  barrel: Barrel, beer: Beer, glasswater: GlassWater, hamburger: Hamburger,
  shrimp: Shrimp, fish: Fish, beef: Beef, cookingpot: CookingPot,
} as const;

const testimonials = [
  {
    name: 'Maria Popescu',
    text: 'Mâncarea este delicioasă și vederea de pe rooftop este spectaculoasă! Livrarea a fost foarte rapidă.',
    rating: 5,
    date: '2 zile în urmă',
  },
  {
    name: 'Alexandru Ionescu',
    text: 'Pizza Sky Special este extraordinară! Ingredientele sunt proaspete și atmosfera de pe terasă este unică.',
    rating: 5,
    date: '1 săptămână în urmă',
  },
  {
    name: 'Diana Munteanu',
    text: 'Serviciu excellent și mâncare de calitate. Recomand cu încredere pentru evenimente speciale.',
    rating: 5,
    date: '2 săptămâni în urmă',
  },
];

export default function HomePage() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [popularCategories, setPopularCategories] = useState<Category[]>();

  // Popular categories (unchanged)
  useEffect(() => {
    const fetchPopularCategories = async () => {
      try {
        const response = await apiClient.getPopularCategories();
        setPopularCategories(response);
      } catch (error) {
        console.error(error);
        toast.error('Eroare la încărcarea categoriilor');
      }
    };
    fetchPopularCategories();
  }, []);

  // Recommended products from active recommendations (one per category)
  useEffect(() => {
    const fetchActiveRecommendations = async () => {
      try {
        // 1) Get all categories
        const catsRes = await apiClient.getCategories({ page: 1, pageSize: 1000 });
        const categories: Category[] = Array.isArray((catsRes as any)?.data) ? (catsRes as any).data : (catsRes as any);

        if (!Array.isArray(categories) || categories.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        // 2) For each category, fetch active recommendation
        const settled = await Promise.allSettled(
            categories.map((c) => apiClient.getActiveRecommendation({ category_id: c.id }))
        );

        // 3) Extract products (depending on response shape)
        const prods: Product[] = [];
        for (const s of settled) {
          if (s.status === 'fulfilled') {
            const payload = s.value;
            // possible shapes:
            // { data: null }
            // { data: { product: Product, ... } }
            // or { data: Product } (if your API returns the product directly)
            const data = (payload as any)?.data ?? null;
            if (!data) continue;

            if ((data as any).product) {
              prods.push((data as any).product as Product);
            } else if ((data as any).id && (data as any).name) {
              prods.push(data as Product);
            }
          }
        }

        // 4) Dedupe by product.id
        const uniqById = Array.from(new Map(prods.map(p => [p.id, p])).values());
        setRecommendedProducts(uniqById);
      } catch (e) {
        console.error(e);
        toast.error('Eroare la încărcarea produselor recomandate');
        setRecommendedProducts([]);
      }
    };

    fetchActiveRecommendations();
  }, []);

  return (
      <>
        <Header />
        <CartSheet />

        <main>
          {/* Hero Section */}
          <section className="relative h-[70vh] lg:h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                  src="/hero.jpeg"
                  alt="Sky Caffe Rooftop"
                  fill
                  className="object-cover"
                  priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--hero)/0.65)_0%,hsl(var(--hero-contrast)/0.65)_100%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center text-white px-4 max-w-4xl">
              <div className="animate-fade-in">
                <Badge className="bg-white/20 text-white border-white/30 mb-4">
                  Rooftop Experience
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  Bistro la înălțime<br />
                  cu <span className="bg-gradient-to-r from-[hsl(var(--accent))] to-yellow-300 bg-clip-text text-transparent">livrare rapidă</span>
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Experiență culinară premium în centrul Năvodariului.
                  Savurează mâncarea delicioasă cu o priveliște spectaculoasă.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                    <Link href="/meniu">
                      Explorează meniul
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Link href="/despre">
                      Despre noi
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="absolute bottom-8 left-4 right-4 z-10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-4xl mx-auto">
                <Card className="bg-white/90 backdrop-blur-sm border-0">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Program</p>
                      <p className="text-gray-600">L–D: 10:00–22:30</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg:white/90 backdrop-blur-sm border-0">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Locație</p>
                      <p className="text-gray-600">Rooftop, etaj 4</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-0">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[hsl(var(--primary))]" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Comenzi</p>
                      <p className="text-gray-600">0751 123 456</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Categories Section */}
          {popularCategories && popularCategories.length > 0 &&  (
              <section className="py-16 bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                      Categorii <span className="text-[hsl(var(--primary))]">populare</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Descoperă varietatea noastră de preparate, de la pizza artizanală la deserturi rafinate
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {popularCategories.map((category) => {
                      const Icon =
                          categoryIcons[
                          (category.icon as keyof typeof categoryIcons) ?? 'grid'
                              ] || Grid3X3;

                      return (
                          <Link key={category.id} href={`/meniu?category=${category.id}`}>
                            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full">
                              <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/20 transition-colors">
                                  <Icon className="w-8 h-8 text-[hsl(var(--primary))]" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {category.description}
                                </p>
                              </CardContent>
                            </Card>
                          </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
          )}

          {/* Recommended Products (active per category) */}
          {recommendedProducts.length > 0 && (
              <section className="py-16">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" />
                      <h2 className="text-3xl lg:text-4xl font-bold">
                        Preparate <span className="text-[hsl(var(--accent))]">recomandate</span>
                      </h2>
                      <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" />
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Preparate active recomandate, câte unul din fiecare categorie.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {recommendedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            showCategory
                            className="animate-fade-in"
                        />
                    ))}
                  </div>

                  <div className="text-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 hover:from-[hsl(var(--primary))]/90 hover:to-[hsl(var(--primary))]/70">
                      <Link href="/meniu">
                        Vezi toate preparatele
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
          )}

          {/* Testimonials */}
          <section className="py-16 bg-muted/20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Ce spun <span className="text-[hsl(var(--primary))]">clienții</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Experiențele și părerile celor care au savurat preparatele noastre
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                    <Card key={index} className="animate-fade-in">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-[hsl(var(--accent))] fill-current" />
                          ))}
                        </div>

                        <div className="relative mb-6">
                          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-muted-foreground/20" />
                          <p className="text-muted-foreground italic pl-6">
                            &quot;{testimonial.text}&quot;
                          </p>
                        </div>

                        <div className="border-t border-border pt-4">
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Pregătit să comandă?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Livrare rapidă în Năvodari sau ridică comanda direct de pe rooftop-ul nostru
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-4">
                  <Link href="/meniu">
                    Comandă acum
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4 bg-transparent border-white/30 text-white hover:bg-white/10">
                  <Link href="tel:0751123456">
                    Sună acum
                    <Phone className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </>
  );
}
