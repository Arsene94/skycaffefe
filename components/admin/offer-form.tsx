'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { categories } from '@/data/categories';
import {Offer, Product} from '@/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import apiClient from "@/lib/api";

const offerSchema = z.object({
  name: z.string()
      .min(2, 'Numele trebuie să aibă cel puțin 2 caractere')
      .max(100, 'Numele este prea lung'),

  description: z.string()
      .min(10, 'Descrierea trebuie să aibă cel puțin 10 caractere')
      .max(500, 'Descrierea este prea lungă'),

  type: z.union([z.literal('PERCENT'), z.literal('FIXED')]),

  value: z.number()
      .min(0.01, 'Valoarea trebuie să fie pozitivă')
      .max(1000, 'Valoarea este prea mare'),

  applicationType: z.union([z.literal('cart'), z.literal('category'), z.literal('productIds')]),

  categoryId: z.string().optional(),
  productIds: z.array(z.string()).optional(),

  minItems: z.number().min(0).optional().nullable(),
  minSubtotal: z.number().min(0).optional().nullable(),

  stackable: z.boolean(),
  priority: z.number().min(1, 'Prioritatea trebuie să fie cel puțin 1').max(100, 'Prioritatea nu poate fi mai mare de 100'),
  active: z.boolean(),
}).superRefine((data, ctx) => {
  // Validate percentage values
  if (data.type === 'PERCENT' && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Procentul nu poate fi mai mare de 100%',
      path: ['value'],
    });
  }

  // Validate application type requirements
  if (data.applicationType === 'category' && !data.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Trebuie să selectați o categorie',
      path: ['categoryId'],
    });
  }

  if (data.applicationType === 'productIds' && (!data.productIds || data.productIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Trebuie să selectați cel puțin un produs',
      path: ['productIds'],
    });
  }
});

type OfferFormData = {
  name: string;
  description: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  applicationType: 'cart' | 'category' | 'productIds';
  categoryId?: string;
  productIds?: string[];
  minItems?: number | null;
  minSubtotal?: number | null;
  stackable: boolean;
  priority: number;
  active: boolean;
};

interface OfferFormProps {
  offer?: Offer;
  onClose: () => void;
  onSave?: (offer: Partial<Offer>) => Promise<void>;
}

export function OfferForm({ offer, onClose, onSave }: OfferFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(offer?.productIds || []);
  const [startDate, setStartDate] = useState<Date | undefined>(
      offer?.conditions?.startDate ? new Date(offer.conditions.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
      offer?.conditions?.endDate ? new Date(offer.conditions.endDate) : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ products, setProducts ] = useState<Product[]>();

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: offer?.name || '',
      description: offer?.description || '',
      type: offer?.type || 'PERCENT',
      value: offer?.value || 0,
      applicationType: offer?.applicationType || 'cart',
      categoryId: offer?.categoryId || '',
      productIds: offer?.productIds || [],
      minItems: offer?.conditions?.minItems || null,
      minSubtotal: offer?.conditions?.minSubtotal || null,
      stackable: offer?.stackable || false,
      priority: offer?.priority || 1,
      active: offer?.active ?? true,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger, reset } = form;

  const applicationType = watch('applicationType');
  const offerType = watch('type');

  // Update form when offer prop changes
  useEffect(() => {
    if (offer) {
      reset({
        name: offer.name || '',
        description: offer.description || '',
        type: offer.type || 'PERCENT',
        value: offer.value || 0,
        applicationType: offer.applicationType || 'cart',
        categoryId: offer.categoryId || '',
        productIds: offer.productIds || [],
        minItems: offer.conditions?.minItems || null,
        minSubtotal: offer.conditions?.minSubtotal || null,
        stackable: offer.stackable || false,
        priority: offer.priority || 1,
        active: offer.active ?? true,
      });
      setSelectedProducts(offer.productIds || []);
      setStartDate(offer.conditions?.startDate ? new Date(offer.conditions.startDate) : undefined);
      setEndDate(offer.conditions?.endDate ? new Date(offer.conditions.endDate) : undefined);
    }
  }, [offer, reset]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.getProducts({ page: 1, pageSize: 1000 });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }

    fetchProducts();
  }, []);

  // Clear category/product selection when application type changes
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

  // Validate date range
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Data de început nu poate fi după data de sfârșit');
      setEndDate(undefined);
    }
  }, [startDate, endDate]);

  if (!products) {
    return <div>Se încarcă produsele...</div>;
  }

  const addProduct = (productId: string) => {
    if (productId && !selectedProducts.includes(productId)) {
      const updatedProducts = [...selectedProducts, productId];
      setSelectedProducts(updatedProducts);
      setValue('productIds', updatedProducts);
      trigger('productIds'); // Trigger validation
    }
  };

  const removeProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(id => id !== productId);
    setSelectedProducts(updatedProducts);
    setValue('productIds', updatedProducts);
    trigger('productIds'); // Trigger validation
  };

  const onSubmit = async (data: OfferFormData) => {
    // Additional validation for date range
    if (startDate && endDate && startDate > endDate) {
      toast.error('Data de început nu poate fi după data de sfârșit');
      return;
    }

    setIsSubmitting(true);

    try {
      const offerData: Partial<Offer> = {
        ...data,
        conditions: {
          minItems: data.minItems || undefined,
          minSubtotal: data.minSubtotal || undefined,
          startDate,
          endDate,
        },
        id: offer?.id, // Preserve existing ID if updating
      };

      if (onSave) {
        await onSave(offerData);
      } else {
        // Simulate API call if no onSave provided
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Offer data:', offerData);
      }

      toast.success(
          offer ? 'Ofertă actualizată cu succes' : 'Ofertă adăugată cu succes'
      );

      onClose();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Eroare la salvarea ofertei');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informații de bază</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nume ofertă *</Label>
              <Input
                  id="name"
                  placeholder="Introduceți numele ofertei"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descriere *</Label>
              <Textarea
                  id="description"
                  rows={3}
                  placeholder="Descrieți oferta..."
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Setări discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tip discount *</Label>
                <Select
                    value={watch('type')}
                    onValueChange={(value) => {
                      setValue('type', value as 'PERCENT' | 'FIXED');
                      trigger('value'); // Re-validate value when type changes
                    }}
                >
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Alege tipul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Procent (%)</SelectItem>
                    <SelectItem value="FIXED">Sumă fixă (lei)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  Valoare * {offerType === 'PERCENT' ? '(%)' : '(lei)'}
                </Label>
                <Input
                    id="value"
                    type="number"
                    step={offerType === 'PERCENT' ? '1' : '0.01'}
                    min="0.01"
                    max={offerType === 'PERCENT' ? '100' : '1000'}
                    placeholder={offerType === 'PERCENT' ? 'ex: 20' : 'ex: 50.00'}
                    {...register('value', {
                      valueAsNumber: true,
                      onChange: () => trigger('value') // Trigger validation on change
                    })}
                    className={errors.value ? 'border-destructive' : ''}
                />
                {errors.value && (
                    <p className="text-sm text-destructive">{errors.value.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioritate *</Label>
                <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="ex: 1"
                    {...register('priority', { valueAsNumber: true })}
                    className={errors.priority ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  1 = prioritate maximă, 100 = prioritate minimă
                </p>
                {errors.priority && (
                    <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="stackable"
                      checked={watch('stackable')}
                      onCheckedChange={(checked) => setValue('stackable', !!checked)}
                  />
                  <Label htmlFor="stackable">Stackable</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Poate fi combinată cu alte oferte
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="active"
                      checked={watch('active')}
                      onCheckedChange={(checked) => setValue('active', !!checked)}
                  />
                  <Label htmlFor="active">Activă</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Reguli de aplicare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applicationType">Tip aplicare *</Label>
              <Select
                  value={watch('applicationType')}
                  onValueChange={(value) => {
                    setValue('applicationType', value as any);
                    trigger('applicationType');
                  }}
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
              {errors.applicationType && (
                  <p className="text-sm text-destructive">{errors.applicationType.message}</p>
              )}
            </div>

            {/* Category Selection */}
            {applicationType === 'category' && (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categorie *</Label>
                  <Select
                      value={watch('categoryId') || ''}
                      onValueChange={(value) => {
                        setValue('categoryId', value);
                        trigger('applicationType');
                      }}
                  >
                    <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Alege categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                      <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>
            )}

            {/* Product Selection */}
            {applicationType === 'productIds' && (
                <div className="space-y-2">
                  <Label>Produse selectate *</Label>

                  {/* Selected products */}
                  {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedProducts.map((productId) => {
                          const product = products?.find(p => p.id === productId);
                          return product ? (
                              <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                                {product.name}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-0 w-4 h-4 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => removeProduct(productId)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                          ) : null;
                        })}
                      </div>
                  )}

                  {/* Product selector */}
                  <Select onValueChange={addProduct} value="">
                    <SelectTrigger className={errors.productIds ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Adaugă produs" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                          ?.filter(product => !selectedProducts.includes(product.id))
                          .map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.price} lei
                              </SelectItem>
                          ))}
                      {products?.filter(product => !selectedProducts.includes(product.id)).length === 0 && (
                          <SelectItem value="" disabled>
                            Nu mai sunt produse disponibile
                          </SelectItem>
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
          <CardHeader>
            <CardTitle>Condiții</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minItems">Număr minim produse</Label>
                <Input
                    id="minItems"
                    type="number"
                    min="0"
                    placeholder="ex: 2"
                    {...register('minItems', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Lasă gol pentru fără condiție
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minSubtotal">Subtotal minim (lei)</Label>
                <Input
                    id="minSubtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 100.00"
                    {...register('minSubtotal', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Lasă gol pentru fără condiție
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data început</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: ro }) : 'Alege data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data sfârșit</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP', { locale: ro }) : 'Alege data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0));
                          const minDate = startDate || today;
                          return date < minDate;
                        }}
                        initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
                ? 'Se salvează...'
                : offer
                    ? 'Actualizează oferta'
                    : 'Adaugă oferta'
            }
          </Button>
        </div>
      </form>
  );
}
