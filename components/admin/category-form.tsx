'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Pizza,
  UtensilsCrossed,
  ChefHat,
  Leaf,
  Cake,
  Coffee,
  Grid3X3,
  Utensils,
  Apple,
  Wine,
  Beer,
  Shrimp,
  Fish,
  CookingPot,
} from 'lucide-react';
import { Category } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';
import { z } from 'zod';
import apiClient from '@/lib/api';
import {Checkbox} from "@/components/ui/checkbox";

const categorySchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere').max(50, 'Numele este prea lung'),
  slug: z.string()
      .min(2, 'Slug-ul trebuie să aibă cel puțin 2 caractere')
      .max(50, 'Slug-ul este prea lung')
      .regex(/^[a-z0-9-]+$/, 'Slug-ul poate conține doar litere mici, cifre și liniuțe'),
  description: z.string().min(10, 'Descrierea trebuie să aibă cel puțin 10 caractere').max(200, 'Descrierea este prea lungă'),
  icon: z.string().min(1, 'Alegeți o iconiță'),
  order: z.number().min(1, 'Ordinea trebuie să fie pozitivă').max(100, 'Ordinea este prea mare'),
  is_popular: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
  onSaved?: (saved: Category) => void; // 👈 nou
}

const availableIcons = [
  { id: 'pizza', name: 'Pizza', icon: Pizza },
  { id: 'utensils', name: 'Tacâmuri', icon: UtensilsCrossed },
  { id: 'chefhat', name: 'Pălărie chef', icon: ChefHat },
  { id: 'leaf', name: 'Frunză', icon: Leaf },
  { id: 'cake', name: 'Tort', icon: Cake },
  { id: 'coffee', name: 'Cafea', icon: Coffee },
  { id: 'grid', name: 'Grilă', icon: Grid3X3 },
  { id: 'utensilsalt', name: 'Tacâmuri alt', icon: Utensils },
  { id: 'apple', name: 'Măr', icon: Apple },
  { id: 'wine', name: 'Vin', icon: Wine },
  { id: 'beer', name: 'Bere', icon: Beer },
  { id: 'shrimp', name: 'Crevete', icon: Shrimp },
  { id: 'fish', name: 'Peste', icon: Fish },
  { id: 'cookingpot', name: 'Oala', icon: CookingPot },
];

export function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      icon: category?.icon || '',
      order: category?.order || 1,
      is_popular: category?.is_popular || false,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!category) {
      const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      setValue('slug', slug);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      let saved: Category;

      if (category) {
        // ✅ folosește ID-ul, nu slug-ul
        saved = await apiClient.updateCategory(category.slug, data) as unknown as Category;
      } else {
        saved = await apiClient.createCategory(data) as unknown as Category;
      }

      toast.success(category ? 'Categorie actualizată cu succes' : 'Categorie adăugată cu succes');

      onSaved?.(saved); // 👈 anunță părintele că s-a salvat
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la salvarea categoriei');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIcon = watch('icon');
  const SelectedIconComponent = availableIcons.find(icon => icon.id === selectedIcon)?.icon;

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nume categorie *</Label>
          <Input
              id="name"
              {...register('name', { onChange: handleNameChange })}
              className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
              id="slug"
              {...register('slug')}
              className={errors.slug ? 'border-destructive' : ''}
              placeholder="ex: pizza-speciala"
          />
          <p className="text-xs text-muted-foreground">
            URL-ul categoriei va fi: /meniu?category={watch('slug')}
          </p>
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descriere *</Label>
          <Textarea
              id="description"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
              placeholder="Descriere scurtă a categoriei..."
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Iconiță *</Label>
          <Select value={watch('icon')} onValueChange={(value) => setValue('icon', value)}>
            <SelectTrigger className={errors.icon ? 'border-destructive' : ''}>
              <SelectValue placeholder="Alege iconița">
                {SelectedIconComponent && (
                    <div className="flex items-center space-x-2">
                      <SelectedIconComponent className="w-4 h-4" />
                      <span>{availableIcons.find(icon => icon.id === selectedIcon)?.name}</span>
                    </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableIcons.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                    <SelectItem key={iconOption.id} value={iconOption.id}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{iconOption.name}</span>
                      </div>
                    </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Ordine *</Label>
          <Input
              id="order"
              type="number"
              min="1"
              max="100"
              {...register('order', { valueAsNumber: true })}
              className={errors.order ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">Determină ordinea de afișare (1 = primul)</p>
          {errors.order && <p className="text-sm text-destructive">{errors.order.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Ordine *</Label>
          <Checkbox
              id="is_popular"
              {...register('is_popular')}
              className={errors.is_popular ? 'border-destructive' : ''}
          />
          <p className="text-xs text-muted-foreground">Seteaza categorie populara (maxim 6)</p>
          {errors.is_popular && <p className="text-sm text-destructive">{errors.is_popular.message}</p>}
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează...' : category ? 'Actualizează categoria' : 'Adaugă categoria'}
          </Button>
        </div>
      </form>
  );
}
