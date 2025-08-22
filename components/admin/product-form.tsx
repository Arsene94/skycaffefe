'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/components/ui/cropImage';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import Image from 'next/image';
import { Product, Category } from '@/types';
import apiClient from '@/lib/api';

type Tag = { id: number; name: string };

interface FormData {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;   // Select holds id as string
  tags: number[];     // Tag IDs
  recommended: boolean;
  available: boolean;
}

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSaved?: (saved: Product) => void;
}

export function ProductForm({ product, onClose, onSaved }: ProductFormProps) {
  // Known tags catalog (from server or learned as we create them)
  const [allTags, setAllTags] = useState<Tag[]>(
      product?.tags?.map(t => ({ id: Number(t.id), name: t.name })) || []
  );

  // Selected tags as IDs
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
      product?.tags?.map(t => Number(t.id)) || []
  );

  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image/crop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawImageDataUrl, setRawImageDataUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const form = useForm<FormData>({
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      image: product?.image || '',
      category: product?.category?.id?.toString() || '',
      tags: product?.tags?.map(t => Number(t.id)) || [],
      recommended: product?.recommended ?? false,
      available: product?.available ?? true,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const imageFromInput = watch('image');
  const imagePreview = previewUrl || imageFromInput || product?.image || '';

  // ---------- API data ----------
  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.getCategories(); // should return { data: Category[] } or plain array
        setCategories(res.data ?? res ?? []);
      } catch {
        toast.error('Eroare la încărcarea categoriilor');
      }
    };
    fetchCategories();
  }, []);

  // Load all tags (if endpoint exists)
  useEffect(() => {
    const fetchTags = async () => {
      if (typeof (apiClient as any).getProductTags !== 'function') return;
      try {
        const res = await (apiClient as any).getProductTags(); // expect { data: Tag[] } or Tag[]
        const list: Tag[] = (res?.data ?? res ?? []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
        }));

        // Merge with any tags coming from prefilled product to ensure names available
        const byId = new Map<number, Tag>();
        [...list, ...allTags].forEach(t => byId.set(Number(t.id), { id: Number(t.id), name: t.name }));
        setAllTags(Array.from(byId.values()));
      } catch {
        // silent fail; we can still create tags on the fly
      }
    };
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep RHF 'tags' in sync with our selected IDs
  useEffect(() => {
    setValue('tags', selectedTagIds);
  }, [selectedTagIds, setValue]);

  // Fix: set category after categories are loaded
  useEffect(() => {
    if (product?.category?.id && categories.length > 0) {
      const exists = categories.some(c => String(c.id) === String(product.category.id));
      if (exists) {
        setValue('category', String(product.category.id));
      }
    }
  }, [product?.category?.id, categories, setValue]);

  // ---------- Crop handlers ----------
  const readFile = (file: File): Promise<string | ArrayBuffer | null> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result));
        reader.readAsDataURL(file);
      });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFile(file);
    setRawImageDataUrl(dataUrl as string);
    setShowCrop(true);
  };

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const revokePreviewUrl = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  };

  useEffect(() => {
    return () => revokePreviewUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmCrop = async () => {
    if (!rawImageDataUrl || !croppedAreaPixels) return;

    const croppedDataUrl = await getCroppedImg(rawImageDataUrl, croppedAreaPixels);
    const blob = await fetch(croppedDataUrl).then(r => r.blob());

    const safeSlug = (watch('name') || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const file = new File([blob], `${safeSlug}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedImageFile(file);

    revokePreviewUrl();
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setShowCrop(false);
  };

  // ---------- TAG helpers ----------
  const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, ' ');

  const findTagByName = (name: string) => {
    const target = name.toLowerCase();
    return allTags.find(t => t.name.toLowerCase() === target) || null;
  };

  const handleAddTagById = (id: number) => {
    setSelectedTagIds(prev => (prev.includes(id) ? prev : [...prev, id]));
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
      setAllTags(prev => (prev.some(t => t.id === tag.id) ? prev : [...prev, tag]));
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
    setSelectedTagIds(prev => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
    setNewTag('');
  };

  const handleRemoveTag = (id: number) => {
    setSelectedTagIds(prev => prev.filter(tid => tid !== id));
  };

  // ---------- Submit ----------
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = (data.image || '').trim();

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

      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        image: imageUrl,
        category_id: parseInt(data.category, 10),
        tags: selectedTagIds,
        recommended: data.recommended,
        available: data.available ?? true,
      };

      let saved: Product;

      if (product) {
        saved = await apiClient.updateProduct(product.id, payload);
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

  // Helpers to render selected tag names (IDs -> names)
  const selectedTagsWithNames: Tag[] = selectedTagIds
      .map(id => allTags.find(t => t.id === id))
      .filter(Boolean) as Tag[];

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

        {/* === Image Preview & Upload === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Previzualizare imagine</Label>
            {imagePreview ? (
                <div className="relative w-full aspect-[4/3] overflow-hidden border">
                  <Image src={imagePreview} alt="preview" fill className="object-cover" />
                </div>
            ) : (
                <div className="aspect-[4/3] border flex items-center justify-center text-muted-foreground">
                  Fără imagine
                </div>
            )}
          </div>

          <div className="space-y-3">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Încarcă imagine
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* === Crop Dialog === */}
        <Dialog open={showCrop} onOpenChange={setShowCrop}>
          <DialogContent className="max-w-[420px]">
            <DialogTitle>Decupează imaginea</DialogTitle>
            <div className="relative w-full h-72 bg-gray-100 rounded-md overflow-hidden">
              {rawImageDataUrl && (
                  <Cropper
                      image={rawImageDataUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={4 / 3}
                      cropShape="rect"
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                  />
              )}
            </div>
            <div className="flex gap-2 pt-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCrop(false)}>Anulează</Button>
              <Button className="flex-1" onClick={handleConfirmCrop}>Confirmă</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* === Category === */}
        <div>
          <Label>Categorie *</Label>
          <Select
              value={watch('category')}
              onValueChange={(value: any) => setValue('category', value, { shouldValidate: true })}
          >
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
                {selectedTagsWithNames.map(tag => (
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
            {allTags.map(tag => (
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

        {/* === Checkboxes === */}
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
                id="recommended"
                checked={watch('recommended')}
                onCheckedChange={(checked: any) => setValue('recommended', !!checked)}
            />
            <Label htmlFor="recommended">Recomandat</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
                id="available"
                checked={watch('available')}
                onCheckedChange={(checked: any) => setValue('available', !!checked)}
            />
            <Label htmlFor="available">Disponibil</Label>
          </div>
        </div>

        {/* === Actions === */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Anulează</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
                ? 'Se salvează...'
                : product
                    ? 'Actualizează produs'
                    : 'Adaugă produs'}
          </Button>
        </div>
      </form>
  );
}

export default ProductForm;
