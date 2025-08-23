'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {toast} from 'sonner';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Calendar, Clock, GripVertical, Minus, Plus, Star} from 'lucide-react';
import {formatPrice} from '@/lib/format';
import {cn} from '@/lib/utils';
import apiClient from '@/lib/api';
import type {Category, Product} from '@/types';
import {CategoryCombobox} from '@/components/admin/CategoryCombobox';
import {useAuth} from "@/contexts/auth-context";

type PeriodUnit = 'days' | 'weeks' | 'months';

interface ScheduledRecommendation {
  id: number;
  category_id: number;
  product_id: number;
  duration: number;
  unit: PeriodUnit;
  start_at: string | null;
  end_at: string | null;
  position: number;
  product: Product;
}

export default function AdminRecommendedPage() {
  // UI state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [periodDuration, setPeriodDuration] = useState(1);
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>('weeks');

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [queue, setQueue] = useState<ScheduledRecommendation[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  // Load categories
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await apiClient.getCategories({ page: 1, pageSize: 1000 });
        const list: Category[] = Array.isArray(res?.data) ? res.data : res;
        setCategories(list);
        // set default selection to first category (not "all")
        if (list.length > 0) {
          setSelectedCategory(String(list[0].id));
        }
      } catch (e) {
        console.error(e);
        toast.error('Nu am putut încărca categoriile');
      }
    };
    loadCats();
  }, []);

  // Load queue + available when category changes
  useEffect(() => {
    const loadCategoryData = async () => {
      if (!selectedCategory || selectedCategory === 'all') {
        setQueue([]);
        setAvailableProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.getRecommendations({
          category_id: selectedCategory,
        });
        const data = res.data;
        setQueue(data.queue || []);
        setAvailableProducts(data.available || []);
      } catch (e) {
        console.error(e);
        toast.error('Nu am putut încărca datele pentru această categorie');
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [selectedCategory]);

  const selectedCategoryObj = useMemo(
      () => categories.find(c => String(c.id) === selectedCategory) || null,
      [categories, selectedCategory]
  );

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return <div>Nu ai permisiunea de a accesa această pagină.</div>;
  }

  // Helpers
  const formatPeriod = (duration: number, unit: PeriodUnit) => {
    const map: Record<PeriodUnit, [one: string, many: string]> = {
      days: ['zi', 'zile'],
      weeks: ['săptămână', 'săptămâni'],
      months: ['lună', 'luni'],
    };
    const [one, many] = map[unit];
    return `${duration} ${duration === 1 ? one : many}`;
  };

  const daysRemaining = (endISO: string | null) => {
    if (!endISO) return null;
    const now = new Date();
    const end = new Date(endISO);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isExpired = (endISO: string | null) => {
    if (!endISO) return false;
    return new Date() > new Date(endISO);
  };

  // Actions
  const handleAddWithPeriod = async () => {
    if (!selectedProduct || !selectedCategoryObj) return;
    try {
      const res = await apiClient.createRecommendation({
        category_id: selectedCategoryObj.id,
        product_id: selectedProduct.id,
        duration: periodDuration,
        unit: periodUnit,
      });
      const newItem = res.data as ScheduledRecommendation;
      setQueue(prev => {
        return [...prev, newItem].sort((a, b) => a.position - b.position);
      });
      setAvailableProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      toast.success(`${selectedProduct.name} adăugat în programarea recomandărilor`);
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la adăugare');
    } finally {
      setIsAddDialogOpen(false);
      setSelectedProduct(null);
      setPeriodDuration(1);
      setPeriodUnit('weeks');
    }
  };

  const removeFromQueue = async (recId: number) => {
    const item = queue.find(q => q.id === recId);
    try {
      await apiClient.deleteRecommendation(recId);
      setQueue(prev => prev.filter(q => q.id !== recId));
      if (item?.product) {
        setAvailableProducts(prev => [...prev, item.product]);
      }
      toast.success('Produs eliminat din programare');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la eliminare');
    }
  };

  const sendReorder = async (items: { id: number; position: number }[]) => {
    if (!selectedCategoryObj) return;
    try {
      const res = await apiClient.reorderRecommendations({
        category_id: selectedCategoryObj.id,
        items,
      });
      const updated = res.data as ScheduledRecommendation[];
      setQueue(updated.sort((a, b) => a.position - b.position));
      toast.success('Ordinea a fost salvată');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la salvarea ordinii');
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const arr = [...queue];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    const payload = arr.map((x, i) => ({ id: x.id, position: i }));
    // optimistic update
    setQueue(arr.map((x, i) => ({ ...x, position: i })));
    void sendReorder(payload);
  };

  const moveDown = (index: number) => {
    if (index >= queue.length - 1) return;
    const arr = [...queue];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    const payload = arr.map((x, i) => ({ id: x.id, position: i }));
    setQueue(arr.map((x, i) => ({ ...x, position: i })));
    void sendReorder(payload);
  };

  // UI
  if (loading && !queue.length && !availableProducts.length) {
    return <div>Se încarcă...</div>;
  }
  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produse recomandate (pe categorii)</h1>
            <p className="text-muted-foreground">
              Un produs activ per categorie, restul sunt programate în coadă (perioade).
            </p>
          </div>
        </div>

        {/* Category selector */}
        <div className="max-w-md">
          <Label className="mb-2 block">Selectează categoria</Label>
          <CategoryCombobox
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={(val) => setSelectedCategory(val)}
          />
        </div>

        {/* Grile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue for selected category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-[hsl(var(--accent))] fill-current" />
                <span>
                Programări — {selectedCategoryObj?.name || 'Categorie'} ({queue.length})
              </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nu există programări pentru această categorie</p>
                    <p className="text-sm">Adaugă produse din lista de disponibile</p>
                  </div>
              ) : (
                  queue && queue
                      .sort((a, b) => a.position - b.position)
                      .map((entry, index) => {
                        const { product, start_at, end_at, duration, unit } = entry;
                        const remaining = end_at ? daysRemaining(end_at) : null;
                        const expired = isExpired(end_at);
                        const now = new Date();
                        const isActive =
                            start_at && end_at
                                ? new Date(start_at) <= now && now <= new Date(end_at)
                                : false;
                        const isUpcoming =
                            start_at ? new Date(start_at) > now : false;

                        return (
                            <div
                                key={entry.id}
                                className={cn(
                                    'flex items-center space-x-3 p-3 rounded-lg border',
                                    expired
                                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                        : isActive
                                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                                            : 'bg-muted/30'
                                )}
                            >
                              {/* handle + index */}
                              <div className="flex flex-col items-center space-y-1">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-mono">#{index + 1}</span>
                              </div>

                              {/* image */}
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    sizes="48"
                                    fill
                                    className="object-cover"
                                />
                              </div>

                              {/* info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                                    {formatPrice(product.price)}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {product.category.name}
                                  </Badge>
                                  {isActive && (
                                      <Badge className="text-xs bg-green-600">Activ</Badge>
                                  )}
                                  {isUpcoming && (
                                      <Badge className="text-xs bg-blue-600">Urmează</Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatPeriod(duration, unit)}</span>
                                  {start_at && end_at && (
                                      <>
                                        <span>•</span>
                                        <span>
                                {new Date(start_at).toLocaleDateString('ro-RO')} –{' '}
                                          {new Date(end_at).toLocaleDateString('ro-RO')}
                              </span>
                                      </>
                                  )}
                                  {expired ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Expirat
                                      </Badge>
                                  ) : isActive && remaining !== null ? (
                                      <Badge variant="secondary" className="text-xs">
                                        {remaining} {remaining === 1 ? 'zi' : 'zile'} rămase
                                      </Badge>
                                  ) : null}
                                </div>
                              </div>

                              {/* reorder */}
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
                                    disabled={index === queue.length - 1}
                                >
                                  ↓
                                </Button>
                              </div>

                              {/* remove */}
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromQueue(entry.id)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                        );
                      })
              )}
            </CardContent>
          </Card>

          {/* Available products for selected category */}
          <Card>
            <CardHeader>
              <CardTitle>
                Produse disponibile ({availableProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {availableProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nu mai sunt produse disponibile pentru această categorie</p>
                  </div>
              ) : (
                  availableProducts.map((product) => (
                      <div
                          key={product.id}
                          className="flex items-center space-x-3 p-3 bg-card rounded-lg border hover:bg-muted/20 transition-colors"
                      >
                        {/* image */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                              src={product.image}
                              alt={product.name}
                              sizes="48"
                              fill
                              className="object-cover"
                          />
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                              {formatPrice(product.price)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {product.category.name}
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
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsAddDialogOpen(true);
                            }}
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

        {/* Add Product Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adaugă în recomandate</DialogTitle>
            </DialogHeader>

            {selectedProduct && (
                <div className="space-y-6">
                  {/* preview */}
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          sizes="48"
                          fill
                          className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedProduct.name}</p>
                      <p className="text-sm text-[hsl(var(--primary))] font-semibold">
                        {formatPrice(selectedProduct.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Categoria: {selectedProduct.category.name}
                      </p>
                    </div>
                  </div>

                  {/* period selection */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Selectează perioada de recomandare</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Durată</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="12"
                            value={periodDuration}
                            onChange={(e) =>
                                setPeriodDuration(parseInt(e.target.value) || 1)
                            }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Unitate</Label>
                        <Select
                            value={periodUnit}
                            onValueChange={(value: PeriodUnit) => setPeriodUnit(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">
                              {periodDuration === 1 ? 'Zi' : 'Zile'}
                            </SelectItem>
                            <SelectItem value="weeks">
                              {periodDuration === 1 ? 'Săptămână' : 'Săptămâni'}
                            </SelectItem>
                            <SelectItem value="months">
                              {periodDuration === 1 ? 'Lună' : 'Luni'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Anulează
                    </Button>
                    <Button onClick={handleAddWithPeriod}>
                      Adaugă în recomandate
                    </Button>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">💡 Sfaturi</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Un singur produs activ per categorie; restul sunt programate în coadă</li>
              <li>• Ordinea din listă determină calendarul; reordonarea recalculează perioadele</li>
              <li>• Fiecare programare are o durată (zile/săptămâni/luni)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
  );
}
