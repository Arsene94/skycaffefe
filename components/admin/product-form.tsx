'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

import Image from 'next/image';
import { Product, Category, EU_ALLERGENS } from '@/types';
import apiClient from '@/lib/api';

// Simple toggle chip buttons for allergens
function AllergensButtons({
                              value,
                              onChange,
                          }: {
    value: string[];
    onChange: (next: string[]) => void;
}) {
    const toggle = (id: string) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {EU_ALLERGENS.map((a) => {
                const active = value.includes(a.id);
                return (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.id)}
                        className={[
                            'px-3 py-1.5 rounded-md text-sm border transition-colors',
                            active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-input hover:bg-muted',
                        ].join(' ')}
                    >
                        {a.label}
                    </button>
                );
            })}
        </div>
    );
}

// ------------------------------
// Tags type
// ------------------------------
type Tag = { id: number; name: string };

// ------------------------------
// Form Data type (includes inventory & allergens)
// ------------------------------
interface FormData {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string; // category id as string
    tags: number[]; // tag IDs
    available: boolean;

    // Inventory
    in_stock: boolean;
    stock_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PERMANENT';
    stock_quantity: number;
    nutritional_values: string;
    ingredients?: string;

    // Allergens array (string keys from EU_ALLERGENS)
    allergens: string[];
    show_delivery: boolean;
    show_menu: boolean;
}

interface ProductFormProps {
    product?: Product;
    onClose: () => void;
    onSaved?: (saved: Product) => void;
}

export function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
    // Known tags (from API) - local cache
    const [allTags, setAllTags] = useState<Tag[]>(
        product?.tags?.map((t) => ({ id: Number((t as any).id), name: (t as any).name })) || []
    );

    // Selected tag IDs
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
        product?.tags?.map((t) => Number((t as any).id)) || []
    );

    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image upload (fără crop)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<FormData>({
        defaultValues: {
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            image: product?.image || '',
            category: (product as any)?.category?.id ? String((product as any).category?.id) : '',
            tags: product?.tags?.map((t) => Number((t as any).id)) || [],
            available: product?.available ?? true,

            // Inventory (with safe fallbacks)
            in_stock: (product as any)?.in_stock ?? true,
            stock_type: (product as any)?.stock_type ?? 'PERMANENT',
            stock_quantity: (product as any)?.stock_quantity ?? 0,
            nutritional_values: (product as any)?.nutritional_values ?? '',
            ingredients: (product as any)?.ingredients ?? '',

            // Allergens array
            allergens: Array.isArray((product as any)?.allergens) ? (product as any).allergens : [],
            show_delivery: product?.show_delivery ?? true,
            show_menu: product?.show_menu ?? true,
        },
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

    const imageFromInput = watch('image');
    // pentru preview: întâi blob selectat, apoi URL din form (sau din product)
    const imagePreview = previewUrl || imageFromInput || product?.image || '';

    // Watchers for inventory & allergens
    const inStock = watch('in_stock');
    const stockType = watch('stock_type');
    const stockQuantity = watch('stock_quantity');
    const allergens = watch('allergens') || [];

    // ---------- API data ----------
    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiClient.getCategories();
                setCategories(res.data ?? res ?? []);
            } catch {
                toast.error('Eroare la încărcarea categoriilor');
            }
        };
        fetchCategories();
    }, []);

    // Load tags if endpoint exists
    useEffect(() => {
        const fetchTags = async () => {
            if (typeof (apiClient as any).getProductTags !== 'function') return;
            try {
                const res = await (apiClient as any).getProductTags();
                const list: Tag[] = (res?.data ?? res ?? []).map((t: any) => ({
                    id: Number(t.id),
                    name: String(t.name),
                }));
                const byId = new Map<number, Tag>();
                [...list, ...allTags].forEach((t) => byId.set(t.id, { id: t.id, name: t.name }));
                setAllTags(Array.from(byId.values()));
            } catch {
                // ignore
            }
        };
        fetchTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep RHF 'tags' in sync with selectedTagIds
    useEffect(() => {
        setValue('tags', selectedTagIds);
    }, [selectedTagIds, setValue]);

    // Ensure existing category is set after categories load
    useEffect(() => {
        if ((product as any)?.category?.id && categories.length > 0) {
            const id = String((product as any).category.id);
            if (categories.some((c) => String(c.id) === id)) {
                setValue('category', id);
            }
        }
    }, [categories, product, setValue]);

    // ---------- Image handlers (no crop) ----------
    const revokePreviewUrl = () => {
        if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };

    useEffect(() => {
        return () => revokePreviewUrl();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // salvează fișierul selectat pentru upload la submit
        setSelectedImageFile(file);

        // actualizează preview-ul fără crop
        revokePreviewUrl();
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    // ---------- TAG helpers ----------
    const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, ' ');

    const findTagByName = (name: string) => {
        const target = name.toLowerCase();
        return allTags.find((t) => t.name.toLowerCase() === target) || null;
    };

    const handleAddTagById = (id: number) => {
        setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const ensureTag = async (name: string): Promise<Tag | null> => {
        const clean = normalizeTagName(name);
        if (!clean) return null;

        // local match
        const existing = findTagByName(clean);
        if (existing) return existing;

        // create via API -> must return { id, name }
        try {
            setIsAddingTag(true);
            const created = await apiClient.createProductTag(clean);
            const tag: Tag = { id: Number(created.id), name: String(created.name) };
            setAllTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
            return tag;
        } catch (e: any) {
            toast.error(e?.message || 'Nu s-a putut crea eticheta');
            return null;
        } finally {
            setIsAddingTag(false);
        }
    };

    const handleAddTagFromName = async (name: string) => {
        const tag = await ensureTag(name);
        if (!tag) return;
        setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
        setNewTag('');
    };

    const handleRemoveTag = (id: number) => {
        setSelectedTagIds((prev) => prev.filter((tid) => tid !== id));
    };

    // ---------- Submit ----------
    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            let imageUrl = (data.image || '').trim();

            // Dacă s-a selectat un fișier nou, îl încărcăm
            if (selectedImageFile) {
                const res = await apiClient.uploadProductImage(selectedImageFile);
                if (!res?.url) throw new Error('Uploadul imaginii a eșuat');
                imageUrl = res.url;
                setValue('image', imageUrl);
            }

            if (!imageUrl) {
                toast.error('Adaugă o imagine pentru produs.');
                setIsSubmitting(false);
                return;
            }

            // If not in stock, force quantity 0 (backend can also ignore)
            const normalizedQuantity = data.in_stock ? Number(data.stock_quantity || 0) : 0;
            const normalizedStockType = data.in_stock ? data.stock_type : 'PERMANENT';

            const payload = {
                name: data.name,
                description: data.description,
                price: data.price,
                image: imageUrl,
                category_id: parseInt(data.category, 10),
                tags: selectedTagIds,
                available: data.available ?? true,

                // Inventory
                in_stock: data.in_stock,
                stock_type: normalizedStockType,
                stock_quantity: normalizedQuantity,
                nutritional_values: (data.nutritional_values || '').trim(),
                ingredients: (data.ingredients || '').trim() || null,

                // Allergens
                allergens: data.allergens || [],
                show_delivery: data.show_delivery ?? true,
                show_menu: data.show_menu ?? true,
            };

            let saved: Product;

            if (product) {
                saved = await apiClient.updateProduct((product as any).id, payload);
                toast.success('Produs actualizat cu succes');
            } else {
                saved = await apiClient.createProduct(payload);
                toast.success('Produs adăugat cu succes');
            }

            onSaved?.(saved);
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'Eroare la salvarea produsului');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helpers to render selected tag names
    const selectedTagsWithNames: Tag[] = selectedTagIds
        .map((id) => allTags.find((t) => t.id === id))
        .filter(Boolean) as Tag[];

    const generateNutritionalValues = async () => {
        const ingredients = watch('ingredients') || '';
        const productName = watch('name') || '';

        if (!productName.trim()) {
            toast.error('Adaugă mai întâi numele produsului pentru a genera valorile nutriționale.');
            return;
        }

        if (!ingredients.trim()) {
            toast.error('Adaugă mai întâi ingredientele pentru a genera valorile nutriționale.');
            return;
        }

        const payload = {
            name: productName,
            ingredients: ingredients,
        };

        const response = await apiClient.generateNutritionalValues(payload);
        setValue('nutritional_values', response.nutritional_values, { shouldDirty: true });
        toast.success('Valorile nutriționale au fost generate.');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* === Basic Info === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">Nume produs *</Label>
                    <Input id="name" {...register('name', { required: 'Numele este obligatoriu' })} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                    <Label htmlFor="price">Preț (lei) *</Label>
                    <Input
                        id="price"
                        type="number"
                        step="0.01"
                        {...register('price', {
                            valueAsNumber: true,
                            required: 'Prețul este obligatoriu',
                            min: { value: 0.01, message: 'Prețul trebuie să fie pozitiv' },
                        })}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
            </div>

            {/* === Description === */}
            <div>
                <Label htmlFor="description">Descriere *</Label>
                <Textarea
                    id="description"
                    rows={3}
                    {...register('description', {
                        required: 'Descrierea este obligatorie',
                        minLength: { value: 10, message: 'Minim 10 caractere' },
                    })}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            {/* === Ingredients === */}
            <div>
                <Label htmlFor="ingredients">Ingrediente *</Label>
                <Textarea
                    id="ingredients"
                    placeholder="Ex: apă, făină, drojdie, sare, ulei de măsline, sos de roșii, mozzarella, busuioc"
                    rows={3}
                    {...register('ingredients', {
                        required: 'Ingredientele sunt obligatorii',
                        minLength: { value: 10, message: 'Minim 10 caractere' },
                    })}
                />
                {errors.ingredients && <p className="text-sm text-destructive">{errors.ingredients.message}</p>}
            </div>

            {/* === Image Preview & Upload === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Previzualizare imagine</Label>
                    {imagePreview ? (
                        <div className="relative w-full aspect-[4/3] overflow-hidden border rounded-md bg-muted">
                            <Image src={imagePreview} alt="preview" fill className="object-contain p-2" />
                        </div>
                    ) : (
                        <div className="aspect-[4/3] border rounded-md flex items-center justify-center text-muted-foreground">
                            Fără imagine
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Încarcă imagine
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* === Category === */}
            <div>
                <Label>Categorie *</Label>
                <Select value={watch('category')} onValueChange={(value: any) => setValue('category', value, { shouldValidate: true })}>
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Alege categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={String(cat.id)} value={String(cat.id)}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* === Tags (IDs) === */}
            <div>
                <Label>Etichete</Label>

                {/* Selected tags badges */}
                {selectedTagIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedTagsWithNames.map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                                {tag.name}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 h-auto w-4"
                                    onClick={() => handleRemoveTag(tag.id)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Add by input (creates if missing; adds by ID) */}
                <div className="flex gap-2">
                    <Input
                        value={newTag}
                        onChange={(e: any) => setNewTag(e.target.value)}
                        onKeyDown={async (e: any) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!newTag.trim()) return;
                                await handleAddTagFromName(newTag);
                            }
                        }}
                        placeholder="Etichetă nouă"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => newTag.trim() && handleAddTagFromName(newTag)}
                        disabled={!newTag.trim() || isAddingTag}
                    >
                        {isAddingTag ? 'Se adaugă...' : 'Adaugă'}
                    </Button>
                </div>

                {/* Quick chips from allTags (add by ID) */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {allTags.map((tag) => (
                        <Button
                            key={tag.id}
                            variant="outline"
                            size="sm"
                            type="button"
                            className="text-xs h-7"
                            disabled={selectedTagIds.includes(tag.id) || isAddingTag}
                            onClick={() => handleAddTagById(tag.id)}
                        >
                            {tag.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* === Inventory === */}
            <div className="space-y-4">
                <Label>Stoc & valori nutriționale</Label>

                <div className="flex items-center gap-2">
                    <Checkbox id="in_stock" checked={inStock} onCheckedChange={(checked: any) => setValue('in_stock', !!checked)} />
                    <Label htmlFor="in_stock">În stoc</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={inStock ? '' : 'opacity-50 pointer-events-none'}>
                        <Label htmlFor="stock_type">Tip stoc</Label>
                        <Select value={stockType} onValueChange={(val: any) => setValue('stock_type', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Alege tipul de stoc" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAILY">Zilnic</SelectItem>
                                <SelectItem value="WEEKLY">Săptămânal</SelectItem>
                                <SelectItem value="MONTHLY">Lunar</SelectItem>
                                <SelectItem value="PERMANENT">Totală</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={inStock ? '' : 'opacity-50 pointer-events-none'}>
                        <Label htmlFor="stock_quantity">Cantitate</Label>
                        <Input
                            id="stock_quantity"
                            type="number"
                            min={0}
                            value={stockQuantity}
                            onChange={(e) => setValue('stock_quantity', Number(e.target.value) || 0)}
                        />
                    </div>

                    <div className="md:col-span-1"></div>
                </div>

                <div>
                    <Label htmlFor="nutritional_values">Valori nutriționale</Label>
                    <Button type="button" variant="outline" size="sm" className="ms-2 mt-1 mb-2" onClick={() => generateNutritionalValues()}>
                        Generează valorile nutriționale
                    </Button>
                    <Textarea
                        id="nutritional_values"
                        rows={3}
                        placeholder="Ex: 100g: 250 kcal | grăsimi 10g (din care saturate 3g) | carbohidrați 30g | proteine 8g | sare 0.9g"
                        {...register('nutritional_values')}
                    />
                </div>
            </div>

            {/* === Allergens (EU) === */}
            <div className="space-y-2">
                <Label>Alergeni (UE)</Label>
                <AllergensButtons value={allergens} onChange={(next) => setValue('allergens', next, { shouldDirty: true })} />
                {allergens.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {EU_ALLERGENS.filter((a) => allergens.includes(a.id)).map((a) => (
                            <Badge key={a.id} variant="secondary">
                                {a.label}
                            </Badge>
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">Selectează alergenii prezenți în produs. (Nu se pot adăuga alții noi.)</p>
            </div>

            {/* === Checkboxes === */}
            <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                    <Checkbox id="available" checked={watch('available')} onCheckedChange={(checked: any) => setValue('available', !!checked)} />
                    <Label htmlFor="available">Disponibil</Label>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                    <Checkbox id="show_delivery" checked={watch('show_delivery')} onCheckedChange={(checked: any) => setValue('show_delivery', !!checked)} />
                    <Label htmlFor="show_delivery">Afișează în meniul de delivery</Label>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                    <Checkbox id="show_menu" checked={watch('show_menu')} onCheckedChange={(checked: any) => setValue('show_menu', !!checked)} />
                    <Label htmlFor="show_menu">Afișează în meniul digital</Label>
                </div>
            </div>

            {/* === Actions === */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                    Anulează
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Se salvează...' : product ? 'Actualizează produs' : 'Adaugă produs'}
                </Button>
            </div>
        </form>
    );
}

export default ProductForm;
