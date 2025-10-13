import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';
import { EU_ALLERGENS, Product } from '@/types';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductCardProps {
    product: Product;
    showCategory?: boolean;
    className?: string;
    hideAddButton?: boolean;
    /** Cum să se potrivească imaginea în container: 'contain' (fără crop) sau 'cover' (umple, poate tăia). */
    imageFit?: 'contain' | 'cover';
    /** Raportul containerului de imagine; ex: '4/3', '1/1', etc. */
    imageAspect?: string; // ex: '4/3'
}

export function ProductCard({
                                product,
                                showCategory = false,
                                className,
                                hideAddButton,
                                imageFit = 'contain',
                                imageAspect = '4/3',
                            }: ProductCardProps) {
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        addItem(product);
        toast.success('Produs adăugat în coș', {
            description: `${product.name} a fost adăugat în coșul tău.`,
            duration: 2000,
        });
    };

    return (
        <Card className={cn('group hover:shadow-lg transition-all duration-300 hover:-translate-y-1', className)}>
            <CardContent className="p-0">
                {/* Image */}
                {product.image && (
                    <div
                        className={cn(
                            'relative overflow-hidden rounded-t-lg',
                            // folosim un aspect fix pentru consistență în grid
                            `aspect-[${imageAspect}]`,
                            imageFit === 'contain' // fundal subtil pt bare laterale
                        )}
                    >
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                            className={cn(
                                'transition-transform duration-300',
                                imageFit === 'cover' && 'object-cover group-hover:scale-105',
                                imageFit === 'contain' && 'object-contain p-2'
                            )}
                            // pentru contain, nu are sens hover scale
                            priority={false}
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {product.recommended && (
                                <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Recomandat
                                </Badge>
                            )}
                            {product.tags.some((tag) => tag.id === 'premium') && (
                                <Badge variant="secondary">Premium</Badge>
                            )}
                            {product.tags.some((tag) => tag.id === 'vegetarian') && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Vegetarian
                                </Badge>
                            )}
                        </div>

                        {!product.available && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Badge variant="destructive">Indisponibil</Badge>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div className="space-y-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                            <p className="font-bold text-[hsl(var(--primary))] text-lg flex-shrink-0 ml-2">
                                {formatPrice(product.price)}
                            </p>
                        </div>
                        {showCategory && (
                            <Badge variant="outline" className="text-xs">
                                {product.category.name}
                            </Badge>
                        )}
                    </div>

                    {product.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                    )}

                    {product.nutritional_values && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{product.nutritional_values}</p>
                    )}

                    {/* Tags */}
                    {product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0.5">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Allergens */}
                    {!!product?.allergens?.length && (
                        <div className="flex flex-wrap gap-1">
                            {EU_ALLERGENS.filter((a) => product.allergens.includes(a.id)).map((a) => (
                                <Badge key={a.id} variant="default" className="text-xs px-2 py-0.5">
                                    {a.label}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {!hideAddButton && (
                        <Button className="w-full" onClick={handleAddToCart} disabled={!product.available}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {product.available ? 'Adaugă în coș' : 'Indisponibil'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
