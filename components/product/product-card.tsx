import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';
import {EU_ALLERGENS, Product} from '@/types';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  showCategory?: boolean;
  className?: string;
}

export function ProductCard({ product, showCategory = false, className }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem(product);
    toast.success('Produs adăugat în coș', {
      description: `${product.name} a fost adăugat în coșul tău.`,
      duration: 2000,
    });
  };
console.log(product)
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${className}`}>
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.recommended && (
              <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Recomandat
              </Badge>
            )}
            {product.tags.some(tag => tag.id === 'premium') && (
              <Badge variant="secondary">Premium</Badge>
            )}
            {product.tags.some(tag => tag.id === 'vegetarian') && (
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

          <p className="text-muted-foreground text-sm line-clamp-2">
            {product.description}
          </p>

          <p className="text-muted-foreground text-sm line-clamp-2">
            {product.nutritional_values}
          </p>

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
          {product?.allergens?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                  {EU_ALLERGENS.filter(a => product.allergens.includes(a.id)).map(a => (
                      <Badge key={a.id} variant="default" className="text-xs px-2 py-0.5">{a.label}</Badge>
                  ))}
              </div>
          )}

          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={!product.available}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.available ? 'Adaugă în coș' : 'Indisponibil'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
