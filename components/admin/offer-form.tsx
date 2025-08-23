'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { format, startOfToday } from 'date-fns';
import { ro } from 'date-fns/locale';
import apiClient from '@/lib/api';
import type { Offer, Product, Category } from '@/types';
import { CalendarIcon, X } from 'lucide-react';

const offerSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  type: z.union([z.literal('PERCENT'), z.literal('FIXED'), z.literal('BXGY')]),
  value: z.number().min(0).max(1000).optional(), // pentru BXGY nu e obligatoriu

  // BXGY fields (UI-only)
  bxgyBuy: z.number().min(1).optional(),
  bxgyGet: z.number().min(1).optional(),
  bxgyLimit: z.number().min(1).optional().nullable(),

  applicationType: z.union([z.literal('cart'), z.literal('category'), z.literal('productIds')]),
  categoryId: z.string().optional(),
  productIds: z.array(z.string()).optional(),

  minItems: z.number().min(0).optional().nullable(),
  minSubtotal: z.number().min(0).optional().nullable(),

  stackable: z.boolean(),
  priority: z.number().min(1).max(100),
  active: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT') {
    const v = data.value ?? 0;
    if (v <= 0 || v > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Procent invalid (1-100)', path: ['value'] });
    }
  }
  if (data.type === 'FIXED') {
    const v = data.value ?? 0;
    if (v <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valoare fixă trebuie să fie > 0', path: ['value'] });
    }
  }
  if (data.type === 'BXGY') {
    if (!data.bxgyBuy || data.bxgyBuy < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Setează X (min 1)', path: ['bxgyBuy'] });
    }
    if (!data.bxgyGet || data.bxgyGet < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Setează Y (min 1)', path: ['bxgyGet'] });
    }
  }

  if (data.applicationType === 'category' && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selectează o categorie', path: ['categoryId'] });
  }
  if (data.applicationType === 'productIds' && (!data.productIds || data.productIds.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selectează cel puțin un produs', path: ['productIds'] });
  }
});

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferFormProps {
  offer?: Offer | (Offer & { numericId?: number; bxgy?: { buy: number; get: number; limit?: number | null } });
  onClose: () => void;
  onSave?: (payload: any) => Promise<void>;
}

function slugify(input: string) {
  return input
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
}

export function OfferForm({ offer, onClose, onSave }: OfferFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(offer?.productIds || []);
  const [startDate, setStartDate] = useState<Date | undefined>((offer as any)?.startsAt ? new Date((offer as any).startsAt) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>((offer as any)?.endsAt ? new Date((offer as any).endsAt) : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>();
  const [categories, setCategories] = useState<Category[]>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: offer?.name || '',
      description: offer?.description || '',
      type: (offer?.type as any) || 'PERCENT',
      value: offer?.type !== 'BXGY' ? offer?.value || 0 : undefined,

      // ⬇️ citește corect din conditions.bxgy
      bxgyBuy:     (offer as any)?.conditions?.bxgy?.buy    ?? undefined,
      bxgyGet:     (offer as any)?.conditions?.bxgy?.get    ?? undefined,
      bxgyLimit:   (offer as any)?.conditions?.bxgy?.limit  ?? undefined,

      applicationType: (offer?.applicationType as any) || 'cart',
      categoryId: (offer?.categoryId as any) || '',
      productIds: offer?.productIds || [],

      minItems:    (offer as any)?.conditions?.minItems    ?? null,
      minSubtotal: (offer as any)?.conditions?.minSubtotal ?? null,

      stackable: offer?.stackable || false,
      priority: offer?.priority || 1,
      active: offer?.active ?? true,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger, reset } = form;

  const applicationType = watch('applicationType');
  const offerType = watch('type');

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiClient.getProducts({ page: 1, pageSize: 1000 }),
          apiClient.getCategories({ page: 1, pageSize: 1000 }),
        ]);
        setProducts(prodRes?.data ?? []);
        setCategories(catRes?.data ?? []);
      } catch {
        toast.error('Eroare la încărcarea produselor/categoriilor');
      }
    })();
  }, []);

  useEffect(() => {
    if (offer) {
      reset({
        name: offer.name || '',
        description: offer.description || '',
        type: (offer.type as any) || 'PERCENT',
        value: offer.type !== 'BXGY' ? offer.value || 0 : undefined,

        // ⬇️ citește corect din conditions.bxgy
        bxgyBuy:     (offer as any)?.conditions?.bxgy?.buy    ?? undefined,
        bxgyGet:     (offer as any)?.conditions?.bxgy?.get    ?? undefined,
        bxgyLimit:   (offer as any)?.conditions?.bxgy?.limit  ?? undefined,

        applicationType: (offer.applicationType as any) || 'cart',
        categoryId: (offer.categoryId as any) || '',
        productIds: offer.productIds || [],

        minItems:    (offer as any)?.conditions?.minItems    ?? null,
        minSubtotal: (offer as any)?.conditions?.minSubtotal ?? null,

        stackable: offer.stackable || false,
        priority: offer.priority || 1,
        active: offer.active ?? true,
      });

      setSelectedProducts(offer.productIds || []);
      setStartDate((offer as any)?.startsAt ? new Date((offer as any).startsAt) : undefined);
      setEndDate((offer as any)?.endsAt ? new Date((offer as any).endsAt) : undefined);
    }
  }, [offer, reset]);

  useEffect(() => {
    if (applicationType === 'cart') {
      setValue('categoryId', '');
      setValue('productIds', []);
      setSelectedProducts([]);
    } else if (applicationType === 'category') {
      setValue('productIds', []);
      setSelectedProducts([]);
    } else if (applicationType === 'productIds') {
      setValue('categoryId', '');
    }
  }, [applicationType, setValue]);

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Data de început nu poate fi după data de sfârșit');
      setEndDate(undefined);
    }
  }, [startDate, endDate]);

  if (!products || !categories) return <div>Se încarcă...</div>;

  const addProduct = (productId: string) => {
    if (productId && !selectedProducts.includes(productId)) {
      const updated = [...selectedProducts, productId];
      setSelectedProducts(updated);
      setValue('productIds', updated);
      trigger('productIds');
    }
  };
  const removeProduct = (productId: string) => {
    const updated = selectedProducts.filter(id => id !== productId);
    setSelectedProducts(updated);
    setValue('productIds', updated);
    trigger('productIds');
  };

  const onSubmit = async (data: OfferFormData) => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Data de început nu poate fi după data de sfârșit');
      return;
    }

    try {
      const conditions: any = {};
      if (data.minItems != null) conditions.minItems = data.minItems;
      if (data.minSubtotal != null) conditions.minSubtotal = data.minSubtotal;
      if (data.type === 'BXGY') {
        conditions.bxgy = {
          buy: data.bxgyBuy!,
          get: data.bxgyGet!,
          ...(data.bxgyLimit ? { limit: data.bxgyLimit } : {}),
        };
      }

      const payload: any = {
        code: (offer as any)?.code || slugify(data.name),
        name: data.name,
        description: data.description,
        type: data.type,                                       // PERCENT | FIXED | BXGY
        value: data.type === 'BXGY' ? 0 : (data.value ?? 0),   // nefolosit la BXGY
        application_type: data.applicationType === 'productIds' ? 'product_ids' : data.applicationType,
        category_id: data.applicationType === 'category' && data.categoryId ? Number(data.categoryId) : null,
        product_ids: data.applicationType === 'productIds' ? (data.productIds || []).map(id => Number(id)) : [],
        conditions: Object.keys(conditions).length ? conditions : null,
        stackable: data.stackable,
        priority: data.priority,
        active: data.active,
        starts_at: startDate ? startDate.toISOString() : null,
        ends_at: endDate ? endDate.toISOString() : null,
      };

      if (onSave) {
        await onSave(payload);
      } else {
        const numericId = (offer as any)?.numericId ?? (offer as any)?.id;
        if (offer && numericId) {
          await apiClient.updateOffer(numericId, payload);
        } else {
          await apiClient.createOffer(payload);
        }
      }

      toast.success(offer ? 'Ofertă actualizată' : 'Ofertă creată');
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Eroare la salvarea ofertei');
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Informații de bază</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nume ofertă *</Label>
              <Input {...register('name')} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descriere *</Label>
              <Textarea rows={3} {...register('description')} className={errors.description ? 'border-destructive' : ''} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card>
          <CardHeader><CardTitle>Setări discount</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tip discount *</Label>
                <Select
                    value={watch('type')}
                    onValueChange={(v) => setValue('type', v as any)}
                >
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Alege tipul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Procent (%)</SelectItem>
                    <SelectItem value="FIXED">Sumă fixă (lei)</SelectItem>
                    <SelectItem value="BXGY">Cumperi X, primești Y</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>

              {offerType !== 'BXGY' && (
                  <div className="space-y-2">
                    <Label>Valoare * {offerType === 'PERCENT' ? '(%)' : '(lei)'}</Label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        defaultValue={String(watch('value') ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(',', '.');
                          const parsed = parseFloat(raw);
                          setValue('value', isNaN(parsed) ? 0 : parsed);
                        }}
                        className={errors.value ? 'border-destructive' : ''}
                    />
                    {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
                  </div>
              )}
            </div>

            {offerType === 'BXGY' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cumperi X *</Label>
                    <Input type="number" min={1} defaultValue={watch('bxgyBuy') ?? ''} onChange={(e) => setValue('bxgyBuy', Number(e.target.value))} />
                    {errors.bxgyBuy && <p className="text-sm text-destructive">{errors.bxgyBuy.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Primești Y *</Label>
                    <Input type="number" min={1} defaultValue={watch('bxgyGet') ?? ''} onChange={(e) => setValue('bxgyGet', Number(e.target.value))} />
                    {errors.bxgyGet && <p className="text-sm text-destructive">{errors.bxgyGet.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Limită gratuități (opțional)</Label>
                    <Input type="number" min={1} defaultValue={watch('bxgyLimit') ?? ''} onChange={(e) => setValue('bxgyLimit', e.target.value ? Number(e.target.value) : undefined)} />
                  </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioritate *</Label>
                <Input type="number" min={1} max={100} {...register('priority', { valueAsNumber: true })} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={watch('stackable')} onCheckedChange={(c) => setValue('stackable', !!c)} />
                  <Label>Stackable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={watch('active')} onCheckedChange={(c) => setValue('active', !!c)} />
                  <Label>Activă</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Rules */}
        <Card>
          <CardHeader><CardTitle>Reguli de aplicare</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tip aplicare *</Label>
              <Select
                  value={watch('applicationType')}
                  onValueChange={(v) => setValue('applicationType', v as any)}
              >
                <SelectTrigger className={errors.applicationType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Alege tipul de aplicare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cart">Coș întreg</SelectItem>
                  <SelectItem value="category">Categorie specifică</SelectItem>
                  <SelectItem value="productIds">Produse specifice</SelectItem>
                </SelectContent>
              </Select>
              {errors.applicationType && <p className="text-sm text-destructive">{errors.applicationType.message}</p>}
            </div>

            {applicationType === 'category' && (
                <div className="space-y-2">
                  <Label>Categorie *</Label>
                  <Select
                      value={watch('categoryId') || ''}
                      onValueChange={(v) => setValue('categoryId', v)}
                  >
                    <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Alege categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((c) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>
            )}

            {applicationType === 'productIds' && (
                <div className="space-y-2">
                  <Label>Produse selectate *</Label>

                  {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedProducts.map(pid => {
                          const p = (products || []).find(pp => String(pp.id) === String(pid));
                          return p ? (
                              <Badge key={pid} variant="secondary" className="flex items-center gap-1">
                                {p.name}
                                <Button type="button" variant="ghost" size="sm" className="p-0 w-4 h-4" onClick={() => removeProduct(pid)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                          ) : null;
                        })}
                      </div>
                  )}

                  <Select onValueChange={addProduct} value="">
                    <SelectTrigger className={errors.productIds ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Adaugă produs" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products || [])
                          .filter(p => !selectedProducts.includes(String(p.id)))
                          .map(p => (
                              <SelectItem key={String(p.id)} value={String(p.id)}>
                                {p.name} — {p.price} lei
                              </SelectItem>
                          ))}
                      {(products || []).filter(p => !selectedProducts.includes(String(p.id))).length === 0 && (
                          <SelectItem value="" disabled>Nu mai sunt produse disponibile</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedProducts.length === 0 && errors.productIds && (
                      <p className="text-sm text-destructive">Trebuie să selectați cel puțin un produs</p>
                  )}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader><CardTitle>Condiții</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Număr minim produse</Label>
                <Input type="number" min="0" placeholder="ex: 2" {...register('minItems', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Subtotal minim (lei)</Label>
                <Input type="number" step="0.01" min="0" placeholder="ex: 100.00" {...register('minSubtotal', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Data început</Label>
                <div className="relative w-full">
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setStartDateOpen(p => !p)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: ro }) : 'Alege data'}
                  </Button>
                  {startDateOpen && (
                      <div className="absolute z-[9999] bg-white border mt-2 rounded-md shadow-lg">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(d) => { if (d) { setStartDate(d); setStartDateOpen(false); } }}
                            disabled={(d) => d < startOfToday()}
                            initialFocus
                        />
                      </div>
                  )}
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>Data sfârșit</Label>
                <div className="relative w-full">
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setEndDateOpen(p => !p)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: ro }) : 'Alege data'}
                  </Button>
                  {endDateOpen && (
                      <div className="absolute z-[9999] bg-white border mt-2 rounded-md shadow-lg">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(d) => { if (d) { setEndDate(d); setEndDateOpen(false); } }}
                            disabled={(d) => {
                              const minDate = startDate || startOfToday();
                              return d < minDate;
                            }}
                            initialFocus
                        />
                      </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Anulează</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Se salvează...' : offer ? 'Actualizează oferta' : 'Adaugă oferta'}</Button>
        </div>
      </form>
  );
}
