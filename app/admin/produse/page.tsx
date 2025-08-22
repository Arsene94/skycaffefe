'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/format';
import { ProductForm } from '@/components/admin/product-form';
import { toast } from 'sonner';
import Image from 'next/image';
import { Category, Product } from '@/types';
import apiClient from '@/lib/api';
import {CategoryCombobox} from "@/components/admin/CategoryCombobox";

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch categories
  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.getCategories();
        setCategories(response.data);
      } catch {
        toast.error('Eroare la încărcarea categoriilor');
      }
    })();
  }, []);

  // Fetch products
  const reloadProducts = useCallback(async () => {
    try {
      const response = await apiClient.getProducts({
        search: debouncedSearch.trim(),
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setProducts(response.data);
      setTotalProducts(response.total);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea produselor');
    }
  }, [debouncedSearch, selectedCategory, currentPage]);

  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  const handleToggleAvailability = async (productId: number | string) => {
    try {
      const p = products.find((p) => String(p.id) === String(productId));
      if (!p) return;
      await apiClient.updateProduct(String(productId), { available: !p.available });
      await reloadProducts();
      toast.success('Disponibilitate actualizată');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la actualizare disponibilitate');
    }
  };

  const handleToggleRecommended = async (productId: number | string) => {
    try {
      const p: any = products.find((p) => String(p.id) === String(productId));
      if (!p) return;
      await apiClient.updateProduct(String(productId), { recommended: !p.recommended });
      await reloadProducts();
      toast.success('Status recomandat actualizat');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la actualizare recomandare');
    }
  };

  const handleDeleteProduct = async (productId: number | string) => {
    try {
      await apiClient.deleteProduct(Number(productId));
      await reloadProducts();
      toast.success('Produs șters cu succes');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la ștergere');
    }
  };

  const handleSelectCategory = (catId: 'all' | string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  return (
      <div className="space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produse</h1>
            <p className="text-muted-foreground">Gestionează produsele din meniu</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă produs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adaugă produs nou</DialogTitle>
              </DialogHeader>
              <ProductForm
                  onClose={() => setIsAddDialogOpen(false)}
                  onSaved={async () => {
                    setIsAddDialogOpen(false);
                    await reloadProducts();
                  }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex gap-6 w-full max-w-full p-6 overflow-x-hidden">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                  placeholder="Caută produse..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
              />
            </div>

            {/* Category filter (ScrollArea) */}
            <div className="w-full max-w-sm">
              <CategoryCombobox
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelect={handleSelectCategory}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center p-4">
              <p className="text-2xl font-bold text-[hsl(var(--primary))]">{totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total produse</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-4">
              <p className="text-2xl font-bold text-green-600">{products.filter((p) => p.available).length}</p>
              <p className="text-sm text-muted-foreground">Disponibile</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-4">
              <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                {(products as any[]).filter((p) => (p as any).recommended).length}
              </p>
              <p className="text-sm text-muted-foreground">Recomandate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center p-4">
              <p className="text-2xl font-bold text-muted-foreground">{products.filter((p) => !p.available).length}</p>
              <p className="text-sm text-muted-foreground">Indisponibile</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produse ({totalProducts})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Preț</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {!!product.image && product.image_type === 'EXTERNAL' && (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                              </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find((c) => String(c.id) === String((product as any).category?.id))?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-[hsl(var(--primary))]">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                              variant={product.available ? 'default' : 'secondary'}
                              className={
                                product.available
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }
                          >
                            {product.available ? 'Disponibil' : 'Indisponibil'}
                          </Badge>
                          {(product as any).recommended && (
                              <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Recomandat
                              </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAvailability(product.id)}
                              title={product.available ? 'Marchează indisponibil' : 'Marchează disponibil'}
                          >
                            {product.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleRecommended(product.id)}
                              title={(product as any).recommended ? 'Elimină din recomandate' : 'Adaugă în recomandate'}
                          >
                            <Star className={`w-4 h-4 ${(product as any).recommended ? 'fill-current text-[hsl(var(--accent))]' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Empty state */}
            {!products.length && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit produse</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== 'all'
                        ? 'Încearcă să modifici filtrele de căutare'
                        : 'Adaugă primul produs pentru a începe'}
                  </p>
                  {!searchQuery && selectedCategory === 'all' && (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă primul produs
                      </Button>
                  )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                  >
                    ← Înapoi
                  </Button>
                  <span className="text-sm text-muted-foreground">Pagina {currentPage} din {totalPages}</span>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                  >
                    Înainte →
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editează produs</DialogTitle>
            </DialogHeader>
            {editingProduct && (
                <ProductForm
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSaved={async () => {
                      setEditingProduct(null);
                      await reloadProducts();
                    }}
                />
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
