'use client';

import {useEffect, useState} from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Category } from '@/types';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

const categorySchema = z.object({
    name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere').max(50, 'Numele este prea lung'),
    slug: z.string()
        .min(2, 'Slug-ul trebuie să aibă cel puțin 2 caractere')
        .max(50, 'Slug-ul este prea lung')
        .regex(/^[a-z0-9-]+$/, 'Slug-ul poate conține doar litere mici, cifre și liniuțe'),
    description: z.string().min(10, 'Descrierea trebuie să aibă cel puțin 10 caractere').max(200, 'Descrierea este prea lungă'),
    icon: z.string().min(1, 'Alegeți o iconiță'),
    order: z.number().min(1, 'Ordinea trebuie să fie pozitivă').max(100, 'Ordinea este prea mare'),
    show_delivery: z.boolean().optional(),
    show_menu: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: Category;
    onClose: () => void;
    onSaved?: (saved: Category) => void;
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
    { id: 'fish', name: 'Pește', icon: Fish },
    { id: 'cookingpot', name: 'Oală', icon: CookingPot },
];

export function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        reset,
        formState: { errors },
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name || '',
            slug: category?.slug || '',
            description: category?.description || '',
            icon: category?.icon || '',
            order: category?.order ?? 1,
            show_delivery: category?.show_delivery ?? true,
            show_menu: category?.show_menu ?? true,
        },
    });

    // 🔁 dacă `category` vine/ se schimbă după mount, sincronizează form-ul
    useEffect(() => {
        reset({
            name: category?.name || '',
            slug: category?.slug || '',
            description: category?.description || '',
            icon: category?.icon || '',
            order: category?.order ?? 1,
            show_delivery: category?.show_delivery ?? true,
            show_menu: category?.show_menu ?? true,
        });
    }, [category, reset]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        if (!category) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setValue('slug', slug, { shouldDirty: true });
        }
    };

    const onSubmit = async (data: CategoryFormData) => {
        setIsSubmitting(true);
        try {
            let saved: Category;

            if (category) {
                // dacă API-ul tău actualizează după slug, păstrează așa; dacă nu, schimbă în id
                saved = (await apiClient.updateCategory(category.slug, data)) as Category;
            } else {
                saved = (await apiClient.createCategory(data)) as Category;
            }

            toast.success(category ? 'Categorie actualizată cu succes' : 'Categorie adăugată cu succes');
            onSaved?.(saved);
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'Eroare la salvarea categoriei');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedIcon = watch('icon');
    const SelectedIconComponent = availableIcons.find((i) => i.id === selectedIcon)?.icon;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">Nume categorie *</Label>
                <Input
                    id="name"
                    {...register('name', { onChange: handleNameChange })}
                    className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Slug */}
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

            {/* Description */}
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

            {/* Icon */}
            <div className="space-y-2">
                <Label htmlFor="icon">Iconiță *</Label>
                <Select
                    value={selectedIcon}
                    onValueChange={(value) => setValue('icon', value, { shouldDirty: true })}
                >
                    <SelectTrigger className={errors.icon ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Alege iconița" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableIcons.map((iconOption) => {
                            const IconCmp = iconOption.icon;
                            return (
                                <SelectItem key={iconOption.id} value={iconOption.id}>
                                    <div className="flex items-center space-x-2">
                                        <IconCmp className="w-4 h-4" />
                                        <span>{iconOption.name}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {/* afișare selectată (opțional) */}
                {SelectedIconComponent && (
                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <SelectedIconComponent className="w-4 h-4" />
                        <span>{availableIcons.find((i) => i.id === selectedIcon)?.name}</span>
                    </div>
                )}
                {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
            </div>

            {/* Order */}
            <div className="space-y-2">
                <Label htmlFor="order">Ordine *</Label>
                <Input
                    id="order"
                    type="number"
                    min={1}
                    max={100}
                    {...register('order', { valueAsNumber: true })}
                    className={errors.order ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">Determină ordinea de afișare (1 = primul)</p>
                {errors.order && <p className="text-sm text-destructive">{errors.order.message}</p>}
            </div>

            {/* show_delivery */}
            <div className="space-y-2">
                <Label htmlFor="show_delivery">Afișează în meniul de delivery</Label>
                <Controller
                    name="show_delivery"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <Checkbox
                            id="show_delivery"
                            checked={!!value}
                            onCheckedChange={(val) => onChange(Boolean(val))}
                        />
                    )}
                />
                {errors.show_delivery && (
                    <p className="text-sm text-destructive">{String(errors.show_delivery.message)}</p>
                )}
            </div>

            {/* show_menu */}
            <div className="space-y-2">
                <Label htmlFor="show_menu">Afișează în meniul digital</Label>
                <Controller
                    name="show_menu"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <Checkbox
                            id="show_menu"
                            checked={!!value}
                            onCheckedChange={(val) => onChange(Boolean(val))}
                        />
                    )}
                />
                {errors.show_menu && (
                    <p className="text-sm text-destructive">{String(errors.show_menu.message)}</p>
                )}
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
