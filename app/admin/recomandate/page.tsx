'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {Star, GripVertical, Plus, Minus, Grid3X3} from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AdminRecommendedPage() {
  const [recommendedProducts, setRecommendedProducts] = useState(
    products.filter(p => p.recommended)
  );
  const [availableProducts, setAvailableProducts] = useState(
    products.filter(p => !p.recommended)
  );

  const addToRecommended = (product: any) => {
    setRecommendedProducts(prev => [...prev, product]);
    setAvailableProducts(prev => prev.filter(p => p.id !== product.id));
    toast.success(`${product.name} adăugat în recomandate`);
  };

  const removeFromRecommended = (product: any) => {
    setRecommendedProducts(prev => prev.filter(p => p.id !== product.id));
    setAvailableProducts(prev => [...prev, product]);
    toast.success(`${product.name} eliminat din recomandate`);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...recommendedProducts];
    [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    setRecommendedProducts(newList);
  };

  const moveDown = (index: number) => {
    if (index === recommendedProducts.length - 1) return;
    const newList = [...recommendedProducts];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setRecommendedProducts(newList);
  };

  const saveOrder = () => {
    // TODO: Save to backend
    toast.success('Ordinea produselor recomandate a fost salvată');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produse recomandate</h1>
          <p className="text-muted-foreground">
            Gestionează produsele recomandate și ordinea lor
          </p>
        </div>

        <Button onClick={saveOrder}>
          Salvează ordinea
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-[hsl(var(--accent))] fill-current" />
              <span>Produse recomandate ({recommendedProducts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nu există produse recomandate</p>
                <p className="text-sm">Adaugă produse din lista de disponibile</p>
              </div>
            ) : (
              recommendedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border"
                >
                  {/* Drag handle & order controls */}
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-center font-mono w-6">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Product image */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                        {formatPrice(product.price)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveDown(index)}
                      disabled={index === recommendedProducts.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromRecommended(product)}
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Available Products */}
        <Card>
          <CardHeader>
            <CardTitle>
              Produse disponibile ({availableProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {availableProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Toate produsele sunt în recomandate</p>
              </div>
            ) : (
              availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-3 p-3 bg-card rounded-lg border hover:bg-muted/20 transition-colors"
                >
                  {/* Product image */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                        {formatPrice(product.price)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      {!product.available && (
                        <Badge variant="secondary" className="text-xs">
                          Indisponibil
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addToRecommended(product)}
                    className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 Sfaturi pentru produse recomandate</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Produsele recomandate apar pe pagina principală și în secțiuni speciale</li>
            <li>• Ordinea din această listă determină ordinea de afișare pe site</li>
            <li>• Se recomandă maxim 6-8 produse recomandate pentru performanță optimă</li>
            <li>• Actualizează regulat produsele recomandate bazându-te pe popularitate</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
