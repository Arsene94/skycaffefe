'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Gift,
  Eye,
  EyeOff,
  Percent,
  DollarSign,
} from 'lucide-react';
import { offers } from '@/data/offers';
import { categories } from '@/data/categories';
import { OfferForm } from '@/components/admin/offer-form';
import { toast } from 'sonner';

export default function AdminOffersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>();

  // Filter offers
  const filteredOffers = useMemo(() => {
    let filtered = offers;

    if (selectedType !== 'all') {
      filtered = filtered.filter(offer => offer.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.name.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.priority - b.priority);
  }, [searchQuery, selectedType]);

  const handleToggleActive = (offerId: string) => {
    // TODO: Implement toggle active status
    toast.success('Status ofertă actualizat');
  };

  const handleDeleteOffer = (offerId: string) => {
    // TODO: Implement delete offer
    toast.success('Ofertă ștearsă cu succes');
  };

  const getOfferTypeIcon = (type: string) => {
    return type === 'PERCENT' ? Percent : DollarSign;
  };

  const getOfferTypeLabel = (type: string) => {
    return type === 'PERCENT' ? 'Procent' : 'Sumă fixă';
  };

  const getApplicationTypeLabel = (type: string) => {
    switch (type) {
      case 'cart': return 'Coș întreg';
      case 'category': return 'Categorie';
      case 'productIds': return 'Produse specifice';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Oferte și reduceri</h1>
          <p className="text-muted-foreground">
            Gestionează ofertele și regulile de discount
          </p>
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
            <OfferForm onClose={() => setIsAddDialogOpen(false)} />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                {offers.length}
              </p>
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
          <CardTitle>
            Oferte ({filteredOffers.length})
          </CardTitle>
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

                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {offer.description}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <TypeIcon className="w-3 h-3" />
                        {getOfferTypeLabel(offer.type)}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-semibold">
                      {offer.type === 'PERCENT' ? `${offer.value}%` : `${offer.value} lei`}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {getApplicationTypeLabel(offer.applicationType)}
                      </Badge>
                      {offer.categoryId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {categories.find(c => c.id === offer.categoryId)?.name}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          #{offer.priority}
                        </Badge>
                        {offer.stackable && (
                          <Badge variant="secondary" className="text-xs">
                            Stackable
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={offer.active ? 'default' : 'secondary'}
                        className={offer.active
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
                          onClick={() => handleToggleActive(offer.id)}
                          title={offer.active ? 'Dezactivează' : 'Activează'}
                        >
                          {offer.active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingOffer(offer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="text-destructive hover:text-destructive"
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
                  : 'Adaugă prima ofertă pentru a începe'
                }
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
      <Dialog
        open={!!editingOffer}
        onOpenChange={(open) => !open && setEditingOffer(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează oferta</DialogTitle>
          </DialogHeader>
          {editingOffer && (
            <OfferForm
              offer={editingOffer}
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
