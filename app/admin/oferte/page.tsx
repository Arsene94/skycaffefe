'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Percent, DollarSign, Gift,
} from 'lucide-react';
import { OfferForm } from '@/components/admin/offer-form';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import {useAuth} from "@/contexts/auth-context";

type BXGY = { buy: number; get: number; limit?: number | null };

type OfferItem = {
  numericId: number;     // from API resource (int)
  id: string;            // code as string id
  code: string;
  name: string;
  description?: string | null;
  type: 'PERCENT' | 'FIXED' | 'BXGY';
  value: number;
  applicationType: 'cart' | 'category' | 'product_ids';
  categoryId?: string | null;
  stackable: boolean;
  priority: number;
  active: boolean;
  isActiveNow?: boolean;
  productIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  conditions?: {
    minItems?: number;
    minSubtotal?: number;
    bxgy?: BXGY;
  } | null;
};

type CategoryItem = {
  id: string | number;
  name: string;
  slug?: string;
};

export default function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'PERCENT' | 'FIXED' | 'BXGY'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);

  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ------- fetch data -------
  const loadAll = async () => {
    try {
      setLoading(true);
      const [offersRes, catsRes] = await Promise.all([
        apiClient.getAdminOffers({ pageSize: 1000 }),
        apiClient.getCategories({ pageSize: 1000 }),
      ]);

      const list: OfferItem[] = (offersRes?.data || []).map((o: any) => ({
        numericId: o.numericId ?? o.id, // fallback
        id: o.id, // code as id
        code: o.code,
        name: o.name,
        description: o.description,
        type: o.type, // poate fi PERCENT | FIXED | BXGY
        value: Number(o.value ?? 0),
        applicationType: o.applicationType,
        categoryId: o.categoryId ?? null,
        stackable: !!o.stackable,
        priority: o.priority ?? 0,
        active: !!o.active,
        isActiveNow: o.isActiveNow,
        productIds: o.productIds ?? [],
        startsAt: o.startsAt ?? null,
        endsAt: o.endsAt ?? null,
        conditions: o.conditions ?? null, // <- aducem și conditions (bxgy e aici)
      }));

      setOffers(list);
      setCategories(catsRes?.data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Eroare la încărcarea ofertelor/categoriilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ------- UI helpers -------
  const getOfferTypeIcon = (type: string) => {
    if (type === 'PERCENT') return Percent;
    if (type === 'FIXED') return DollarSign;
    return Gift; // BXGY
  };

  const getOfferTypeLabel = (type: string) => {
    if (type === 'PERCENT') return 'Procent';
    if (type === 'FIXED') return 'Sumă fixă';
    return 'Cumperi X, primești Y'; // BXGY
  };

  const getApplicationTypeLabel = (type: string) => {
    const normalized = type === 'product_ids' ? 'productIds' : type;
    switch (normalized) {
      case 'cart':
        return 'Coș întreg';
      case 'category':
        return 'Categorie';
      case 'productIds':
        return 'Produse specifice';
      default:
        return normalized;
    }
  };

  const categoryNameById = (id?: string | null) => {
    if (!id) return '';
    const found = categories.find(c => String(c.id) === String(id));
    return found?.name || '';
  };

  // ------- filters -------
  const filteredOffers = useMemo(() => {
    let items = offers.slice();

    if (selectedType !== 'all') {
      items = items.filter(o => o.type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(o =>
          (o.name || '').toLowerCase().includes(q) ||
          (o.description || '').toLowerCase().includes(q) ||
          (o.code || '').toLowerCase().includes(q)
      );
    }

    // sort by priority asc (as in backend)
    items.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    return items;
  }, [offers, selectedType, searchQuery]);

  if (user?.role !== 'ADMIN') {
    return <div>Nu ai permisiunea de a accesa această pagină.</div>;
  }

  // ------- actions -------
  const handleToggleActive = async (offer: OfferItem) => {
    try {
      await apiClient.toggleOfferActive(offer.numericId);
      setOffers(prev =>
          prev.map(o => (o.numericId === offer.numericId ? { ...o, active: !o.active } : o))
      );
      toast.success('Status ofertă actualizat');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Nu am putut actualiza statusul');
    }
  };

  const handleDeleteOffer = async (offer: OfferItem) => {
    try {
      await apiClient.deleteOffer(offer.numericId);
      setOffers(prev => prev.filter(o => o.numericId !== offer.numericId));
      toast.success('Ofertă ștearsă cu succes');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Nu am putut șterge oferta');
    }
  };

  // (CREATE)
  const handleCreateSave = async (payload: any) => {
    await apiClient.createOffer(payload);
    await loadAll();
  };

  // (UPDATE)
  const handleUpdateSave = async (payload: any) => {
    if (!editingOffer) return;
    await apiClient.updateOffer(editingOffer.numericId, payload);
    await loadAll();
  };

  // Deschide edit cu fetch complet (include conditions.bxgy)
  const openEdit = async (row: OfferItem) => {
    try {
      // asigură-te că ai metoda în apiClient (vezi mai jos)
      const full = await apiClient.getAdminOffer(row.numericId);
      const normalized = {
        ...full,
        applicationType:
            (full.applicationType ?? full.application_type) === 'product_ids'
                ? ('productIds' as any)
                : (full.applicationType ?? full.application_type),
        categoryId: full.categoryId ?? full.category_id ?? null,
        productIds: full.productIds ?? full.product_ids ?? [],
        numericId: Number(full.numericId ?? full.id ?? row.numericId),
        startsAt: full.startsAt ?? full.starts_at ?? null,
        endsAt: full.endsAt ?? full.ends_at ?? null,
      };
      setEditingOffer(normalized);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Nu am putut încărca oferta pentru editare');
    }
  };

  if (loading) {
    return <div>Se încarcă ofertele...</div>;
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Oferte și reduceri</h1>
            <p className="text-muted-foreground">Gestionează ofertele și regulile de discount</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă ofertă
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adaugă ofertă nouă</DialogTitle>
              </DialogHeader>
              <OfferForm
                  onSave={handleCreateSave}
                  onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Caută oferte..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                <Button
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('all')}
                >
                  Toate
                </Button>
                <Button
                    variant={selectedType === 'PERCENT' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('PERCENT')}
                >
                  <Percent className="w-4 h-4 mr-1" />
                  Procent
                </Button>
                <Button
                    variant={selectedType === 'FIXED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('FIXED')}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Sumă fixă
                </Button>
                <Button
                    variant={selectedType === 'BXGY' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('BXGY')}
                >
                  <Gift className="w-4 h-4 mr-1" />
                  BXGY
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--primary))]">{offers.length}</p>
                <p className="text-sm text-muted-foreground">Total oferte</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {offers.filter(o => o.active).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                  {offers.filter(o => o.stackable).length}
                </p>
                <p className="text-sm text-muted-foreground">Stackable</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {offers.filter(o => !o.active).length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Oferte ({filteredOffers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ofertă</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Valoare</TableHead>
                  <TableHead>Aplicare</TableHead>
                  <TableHead>Prioritate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((offer) => {
                  const TypeIcon = getOfferTypeIcon(offer.type);
                  const appLabel = getApplicationTypeLabel(offer.applicationType);
                  const catLabel = offer.categoryId ? categoryNameById(offer.categoryId) : '';

                  const bxgy = offer.conditions?.bxgy as BXGY | undefined;

                  return (
                      <TableRow key={offer.numericId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{offer.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {offer.description}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">#{offer.code}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <TypeIcon className="w-3 h-3" />
                            {getOfferTypeLabel(offer.type)}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-semibold">
                          {offer.type === 'PERCENT' && `${offer.value}%`}
                          {offer.type === 'FIXED' && `${offer.value} lei`}
                          {offer.type === 'BXGY' && (
                              <span className="font-mono">
                          {bxgy ? `${bxgy.buy} → ${bxgy.get}` : '—'}
                                {bxgy?.limit ? ` (max ${bxgy.limit})` : ''}
                        </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">{appLabel}</Badge>
                          {offer.applicationType === 'category' && offer.categoryId && (
                              <p className="text-xs text-muted-foreground mt-1">{catLabel}</p>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">#{offer.priority}</Badge>
                            {offer.stackable && (
                                <Badge variant="secondary" className="text-xs">Stackable</Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                              variant={offer.active ? 'default' : 'secondary'}
                              className={
                                offer.active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }
                          >
                            {offer.active ? 'Activă' : 'Inactivă'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(offer)}
                                title={offer.active ? 'Dezactivează' : 'Activează'}
                            >
                              {offer.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(offer)}
                                title="Editează"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteOffer(offer)}
                                className="text-destructive hover:text-destructive"
                                title="Șterge"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredOffers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit oferte</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedType !== 'all'
                        ? 'Încearcă să modifici filtrele de căutare'
                        : 'Adaugă prima ofertă pentru a începe'}
                  </p>
                  {(!searchQuery && selectedType === 'all') && (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă prima ofertă
                      </Button>
                  )}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Offer Dialog */}
        <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editează oferta</DialogTitle>
            </DialogHeader>
            {editingOffer && (
                <OfferForm
                    offer={editingOffer}
                    onSave={handleUpdateSave}
                    onClose={() => setEditingOffer(null)}
                />
            )}
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">💡 Sfaturi pentru oferte</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Prioritatea determină ordinea de aplicare (1 = cea mai mare prioritate)</li>
              <li>• Ofertele stackable se pot combina cu alte oferte</li>
              <li>• Ofertele non-stackable se aplică doar dacă au valoarea cea mai mare</li>
              <li>• Setează condiții minime pentru a controla aplicarea ofertelor</li>
              <li>• Folosește intervale de timp pentru oferte sezoniere sau promoții limitate</li>
            </ul>
          </CardContent>
        </Card>
      </div>
  );
}
