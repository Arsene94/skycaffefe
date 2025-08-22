'use client';

import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Pizza,
    UtensilsCrossed,
    ChefHat,
    Leaf,
    Cake,
    Coffee,
    Grid3X3, Utensils, Apple, Wine, Barrel, Beer, GlassWater, Hamburger, Shrimp, Fish, Beef, CookingPot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  productCounts?: Record<string, number>;
  categories: Category[]; // this comes from the parent (MenuPage)
}

const categoryIcons: Record<string, React.ElementType> = {
    pizza: Pizza, utensils: UtensilsCrossed, chefhat: ChefHat, leaf: Leaf, cake: Cake,
    coffee: Coffee, grid: Grid3X3, utensilsalt: Utensils, apple: Apple, wine: Wine,
    barrel: Barrel, beer: Beer, glasswater: GlassWater, hamburger: Hamburger,
    shrimp: Shrimp, fish: Fish, beef: Beef, cookingpot: CookingPot,
};

export const CategoryFilter: FC<CategoryFilterProps> = ({
                                                          selectedCategory,
                                                          onCategoryChange,
                                                          productCounts,
                                                          categories,
                                                        }) => {
  return (
      <div className="space-y-4 overflow-x-scroll">
        <h3 className="font-semibold text-lg">Categorii</h3>

        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-2 md:pb-0">
          {categories.map((category) => {
            const Icon = categoryIcons[category.icon] || Grid3X3;
            const isSelected = selectedCategory === category.id;

            return (
                <Button
                    key={category.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => onCategoryChange(category.id)}
                    className={cn(
                        'flex items-center justify-start space-x-2 flex-shrink-0 md:w-full',
                        isSelected
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'hover:bg-muted'
                    )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  {typeof productCounts?.[category.id] === 'number' && (
                      <Badge
                          variant={isSelected ? 'secondary' : 'outline'}
                          className="ml-auto"
                      >
                        {productCounts[category.id]}
                      </Badge>
                  )}
                </Button>
            );
          })}
        </div>
      </div>
  );
};
