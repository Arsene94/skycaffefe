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
  Quote,
  Grid3X3,
  Utensils,
  Apple,
  Wine,
  Barrel,
  Beer,
  GlassWater,
  Hamburger,
  Shrimp,
  Fish,
  Beef,
  CookingPot,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from "react";
import { Category, Product } from "@/types";
import apiClient from "@/lib/api";
import { toast } from "sonner";

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

  useEffect(() => {
    const fetchActiveRecommendations = async () => {
      try {
        const catsRes = await apiClient.getCategories({ page: 1, pageSize: 1000 });
        const categories: Category[] = Array.isArray((catsRes as any)?.data) ? (catsRes as any).data : (catsRes as any);

        if (!Array.isArray(categories) || categories.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        const settled = await Promise.allSettled(
            categories.map((c) => apiClient.getActiveRecommendation({ category_id: c.id }))
        );

        const prods: Product[] = [];
        for (const s of settled) {
          if (s.status === 'fulfilled') {
            const payload = s.value;
            const data = (payload as any)?.data ?? null;
            if (!data) continue;

            if ((data as any).product) {
              prods.push((data as any).product as Product);
            } else if ((data as any).id && (data as any).name) {
              prods.push(data as Product);
            }
          }
        }

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

        <main role="main">
          {/* Hero Section - Enhanced for SEO and accessibility */}
          <section className="relative h-[70vh] lg:h-[80vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-[70vh] lg:h-[80vh] overflow-hidden">
              <Image
                  src="/hero.jpeg"
                  alt="Sky Caffe rooftop terrace cu vederea orașului Năvodari, mese elegante și atmosferă premium pentru o experiență culinară de neuitat"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBobHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyovBd2FgvWp8/sVoLakHWp8/sVoLakHWp8/sVoLaktLvqAFNOsHu5vIk9LZDHqbmg=="
              />
              <div
                  className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--hero)/0.65)_0%,hsl(var(--hero-contrast)/0.65)_100%)]"
                  role="presentation"
                  aria-hidden="true"
              />
            </div>

            <div className="relative z-10 text-center text-white px-4 max-w-4xl">
              <div className="animate-fade-in">
                <Badge className="bg-white/20 text-white border-white/30 mb-4" role="status" aria-label="Experiență rooftop">
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

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10" role="group" aria-label="Acțiuni principale">
                  <Button asChild size="lg" className="text-lg px-8 py-4 bg-white text-[hsl(var(--primary))] hover:bg-white/90">
                    <Link href="/meniu" aria-describedby="menu-description">
                      Explorează meniul
                      <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                    </Link>
                  </Button>
                  <span id="menu-description" className="sr-only">Accesează meniul nostru complet cu preparate de calitate</span>

                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Link href="/despre" aria-describedby="about-description">
                      Despre noi
                    </Link>
                  </Button>
                  <span id="about-description" className="sr-only">Află mai multe despre Sky Caffe și povestea noastră</span>
                </div>
              </div>
            </div>

            {/* Info Cards - Enhanced accessibility */}
            <aside className="absolute bottom-8 left-4 right-4 z-10" aria-label="Informații de contact și program">
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-4xl mx-auto">
                <Card className="bg-white/90 backdrop-blur-sm border-0" role="complementary">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Program</p>
                      <p className="text-gray-600">
                        <time dateTime="10:00">10:00</time>–<time dateTime="22:30">22:30</time> zilnic
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-0" role="complementary">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Locație</p>
                      <address className="text-gray-600 not-italic">Rooftop, etaj 4, Centrul Năvodari</address>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-0" role="complementary">
                  <CardContent className="p-4 flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Comenzi</p>
                      <a href="tel:+40751123456" className="text-gray-600 hover:text-[hsl(var(--primary))] transition-colors">
                        0751 123 456
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </section>

          {/* Categories Section */}
          {popularCategories && popularCategories.length > 0 && (
              <section className="py-16 bg-gradient-to-b from-background to-muted/20" aria-labelledby="categories-heading">
                <div className="container mx-auto px-4">
                  <header className="text-center mb-12">
                    <h2 id="categories-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                      Categorii <span className="text-[hsl(var(--primary))]">populare</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Descoperă varietatea noastră de preparate, de la pizza artizanală la deserturi rafinate
                    </p>
                  </header>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6" role="list">
                    {popularCategories.map((category) => {
                      const Icon = categoryIcons[(category.icon as keyof typeof categoryIcons) ?? 'grid'] || Grid3X3;

                      return (
                          <article key={category.id} role="listitem">
                            <Link
                                href={`/meniu?category=${category.id}`}
                                aria-describedby={`category-${category.id}-description`}
                            >
                              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full focus-within:ring-2 focus-within:ring-[hsl(var(--primary))] focus-within:ring-offset-2">
                                <CardContent className="p-6 text-center">
                                  <div
                                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--primary))]/20 transition-colors"
                                      role="img"
                                      aria-label={`Iconiță pentru categoria ${category.name}`}
                                  >
                                    <Icon className="w-8 h-8 text-[hsl(var(--primary))]" aria-hidden="true" />
                                  </div>
                                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                                  <p
                                      id={`category-${category.id}-description`}
                                      className="text-muted-foreground text-sm line-clamp-2"
                                  >
                                    {category.description}
                                  </p>
                                </CardContent>
                              </Card>
                            </Link>
                          </article>
                      );
                    })}
                  </div>
                </div>
              </section>
          )}

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
              <section className="py-16" aria-labelledby="recommended-heading">
                <div className="container mx-auto px-4">
                  <header className="text-center mb-12">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" aria-hidden="true" />
                      <h2 id="recommended-heading" className="text-3xl lg:text-4xl font-bold">
                        Preparate <span className="text-[hsl(var(--accent))]">recomandate</span>
                      </h2>
                      <Star className="w-6 h-6 text-[hsl(var(--accent))] fill-current" aria-hidden="true" />
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Preparatele noastre cele mai apreciate, selectate special pentru tine
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" role="list">
                    {recommendedProducts.map((product) => (
                        <article key={product.id} role="listitem">
                          <ProductCard
                              product={product}
                              showCategory
                              className="animate-fade-in"
                          />
                        </article>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 hover:from-[hsl(var(--primary))]/90 hover:to-[hsl(var(--primary))]/70">
                      <Link href="/meniu" aria-describedby="all-products-description">
                        Vezi toate preparatele
                        <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <span id="all-products-description" className="sr-only">Accesează meniul complet cu toate preparatele disponibile</span>
                  </div>
                </div>
              </section>
          )}

          {/* Testimonials - Enhanced with structured data */}
          <section className="py-16 bg-muted/20" aria-labelledby="testimonials-heading">
            <div className="container mx-auto px-4">
              <header className="text-center mb-12">
                <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                  Ce spun <span className="text-[hsl(var(--primary))]">clienții</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Experiențele și părerile celor care au savurat preparatele noastre
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
                {testimonials.map((testimonial, index) => (
                    <article key={index} className="animate-fade-in" role="listitem">
                      <Card className="h-full">
                        <CardContent className="p-6">
                          <div
                              className="flex items-center space-x-1 mb-4"
                              role="img"
                              aria-label={`Evaluare ${testimonial.rating} din 5 stele`}
                          >
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-[hsl(var(--accent))] fill-current" aria-hidden="true" />
                            ))}
                          </div>

                          <div className="relative mb-6">
                            <Quote className="absolute -top-2 -left-2 w-8 h-8 text-muted-foreground/20" aria-hidden="true" />
                            <blockquote className="text-muted-foreground italic pl-6">
                              &quot;{testimonial.text}&quot;
                            </blockquote>
                          </div>

                          <footer className="border-t border-border pt-4">
                            <cite className="font-semibold not-italic">{testimonial.name}</cite>
                            <time className="block text-sm text-muted-foreground mt-1" dateTime={new Date(Date.now() - (index * 7 * 24 * 60 * 60 * 1000)).toISOString()}>
                              {testimonial.date}
                            </time>
                          </footer>
                        </CardContent>
                      </Card>
                    </article>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section - Enhanced accessibility */}
          <section className="py-16 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" aria-labelledby="cta-heading">
            <div className="container mx-auto px-4 text-center">
              <h2 id="cta-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Pregătit să comandă?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Livrare rapidă în Năvodari sau ridică comanda direct de pe rooftop-ul nostru
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Opțiuni comandă">
                <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-4">
                  <Link href="/meniu" aria-describedby="order-now-description">
                    Comandă acum
                    <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                  </Link>
                </Button>
                <span id="order-now-description" className="sr-only">Comandă online din meniul nostru complet</span>

                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4 bg-transparent border-white/30 text-white hover:bg-white/10">
                  <Link href="tel:+40751123456" aria-describedby="call-now-description">
                    Sună acum
                    <Phone className="ml-2 w-5 h-5" aria-hidden="true" />
                  </Link>
                </Button>
                <span id="call-now-description" className="sr-only">Sună pentru a plasa o comandă sau pentru informații</span>
              </div>
            </div>
          </section>
        </main>

        <Footer />

        {/* Structured Data for Reviews */}
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": testimonials.map((testimonial, index) => ({
                  "@type": "Review",
                  "position": index + 1,
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": testimonial.rating,
                    "bestRating": 5
                  },
                  "author": {
                    "@type": "Person",
                    "name": testimonial.name
                  },
                  "reviewBody": testimonial.text,
                  "itemReviewed": {
                    "@type": "Restaurant",
                    "name": "Sky Caffe",
                    "address": {
                      "@type": "PostalAddress",
                      "streetAddress": "Centrul Năvodari, Rooftop etaj 4",
                      "addressLocality": "Năvodari",
                      "addressCountry": "RO"
                    }
                  }
                }))
              })
            }}
        />
      </>
  );
}
