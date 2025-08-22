'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, Search, Edit, Trash2, Grid3X3, Barrel, Pizza, UtensilsCrossed, ChefHat, Leaf, Cake, Coffee,
  Utensils, Apple, Wine, Beer, GlassWater, Hamburger, Shrimp, Fish, Beef, CookingPot,
} from 'lucide-react';
import { CategoryForm } from '@/components/admin/category-form';
import { toast } from 'sonner';
import {Category, Product} from '@/types';
import apiClient from "@/lib/api";

const categoryIcons = {
  pizza: Pizza, utensils: UtensilsCrossed, chefhat: ChefHat, leaf: Leaf, cake: Cake,
  coffee: Coffee, grid: Grid3X3, utensilsalt: Utensils, apple: Apple, wine: Wine,
  barrel: Barrel, beer: Beer, glasswater: GlassWater, hamburger: Hamburger,
  shrimp: Shrimp, fish: Fish, beef: Beef, cookingpot: CookingPot,
} as const;

const PAGE_SIZE = 10;

export default function AdminCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>(); // Simulated products data

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
        try {
            const response = await apiClient.getProducts({ page: 1, pageSize: 1000 });
            setProducts(response.data);
        } catch (e) {
            console.error(e);
            toast.error('Eroare la încărcarea produselor');
        }
    }

    fetchProducts();
  }, []);

  const reloadCategories = useCallback(async () => {
    try {
      const response = await apiClient.getCategories({
        search: debouncedSearch.trim(),
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setCategories(response.data);
      setTotalCategories(response.total);
    } catch (e) {
      console.error(e);
      toast.error('Eroare la încărcarea categoriilor');
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  const getProductCount = (categoryId: string) =>
      products?.filter(product => product.category.id === categoryId).length;

  const totalPages = Math.ceil(totalCategories / PAGE_SIZE);

  const handleDeleteCategory = async (categoryId: string) => {
    const productCount = getProductCount(categoryId);
    if (productCount && productCount > 0) {
      toast.error('Nu poți șterge categoria', {
        description: `Categoria conține ${productCount} produse. Mută sau șterge produsele mai întâi.`,
      });
      return;
    }
    try {
      await apiClient.deleteCategory(categoryId);
      await reloadCategories();
      toast.success('Categorie ștearsă cu succes');
    } catch (e: any) {
      toast.error(e?.message || 'Eroare la ștergere');
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorii</h1>
            <p className="text-muted-foreground">Gestionează categoriile de produse și ordinea lor</p>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adaugă categorie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adaugă categorie nouă</DialogTitle>
                  <DialogDescription>Completează formularul pentru a crea o categorie.</DialogDescription>
                </DialogHeader>
                <CategoryForm
                    onClose={() => setIsAddDialogOpen(false)}
                    onSaved={async () => {
                      setIsAddDialogOpen(false);
                      await reloadCategories();
                    }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                  placeholder="Caută categorii..."
                  value={searchQuery}
                  onChange={(e) => {
                    setCurrentPage(1); // reset to first page on search
                    setSearchQuery(e.target.value);
                  }}
                  className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categorii ({totalCategories})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Produse</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => {
                  const Icon = categoryIcons[category.icon as keyof typeof categoryIcons] || Grid3X3;
                  const productCount = getProductCount(category.id);

                  return (
                      <TableRow key={category.id}>
                        <TableCell>{(currentPage - 1) * PAGE_SIZE + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[hsl(var(--primary))]" />
                            </div>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">{category.slug}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                              variant={productCount && productCount > 0 ? 'default' : 'secondary'}
                              className={productCount && productCount > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : ''}
                          >
                            {productCount} {productCount === 1 ? 'produs' : 'produse'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-destructive hover:text-destructive"
                                disabled={!!productCount && productCount > 0}
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

            {/* Empty state */}
            {!categories.length && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📂</div>
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit categorii</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Încearcă alt termen de căutare' : 'Adaugă prima categorie pentru a începe'}
                  </p>
                  {!searchQuery && (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă prima categorie
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
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                  >
                    ← Înapoi
                  </Button>
                  <span className="text-sm text-muted-foreground">
                Pagina {currentPage} din {totalPages}
              </span>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                  >
                    Înainte →
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editează categoria</DialogTitle>
              <DialogDescription>Actualizează informațiile categoriei existente.</DialogDescription>
            </DialogHeader>
            {editingCategory && (
                <CategoryForm
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSaved={async () => {
                      setEditingCategory(null);
                      await reloadCategories();
                    }}
                />
            )}
          </DialogContent>
        </Dialog>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">💡 Sfaturi pentru categorii</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ordinea categoriilor determină cum apar în meniu și pe site</li>
              <li>• Slug-ul trebuie să fie unic și să conțină doar litere mici și liniuțe</li>
              <li>• Nu poți șterge o categorie care conține produse</li>
              <li>• Alege icoane relevante pentru o navigare mai intuitivă</li>
              <li>• Descrierile ajută utilizatorii să înțeleagă conținutul categoriei</li>
            </ul>
          </CardContent>
        </Card>
      </div>
  );
}
