'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus, Search, Edit, Trash2, MapPin, Truck, Clock, DollarSign, Slash,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import type { DeliveryZone } from '@/types';
import {useAuth} from "@/contexts/auth-context";

interface DeliveryZoneFormData {
    name: string;
    description: string;
    deliveryFee: number;
    deliveryTime: string;
    minOrder: number;
    active: boolean;
    areas: string[];
}

export default function AdminDeliveryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [formData, setFormData] = useState<DeliveryZoneFormData>({
        name: '',
        description: '',
        deliveryFee: 10,
        deliveryTime: '30-45 min',
        minOrder: 30,
        active: true,
        areas: [],
    });
    const [newArea, setNewArea] = useState('');

    const loadZones = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getAdminDeliveryZones({ pageSize: 1000 });
            setZones(res?.data ?? []);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea zonelor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadZones();
    }, []);

    const filteredZones = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = zones.slice();
        if (q) {
            list = list.filter(z =>
                (z.name || '').toLowerCase().includes(q) ||
                (z.description || '').toLowerCase().includes(q) ||
                (z.areas || []).some(a => (a || '').toLowerCase().includes(q))
            );
        }
        // sort optional by name
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return list;
    }, [zones, searchQuery]);

    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
        return <div>Nu ai permisiunea de a accesa această pagină.</div>;
    }

    const handleAddArea = () => {
        const val = newArea.trim();
        if (val && !formData.areas.includes(val)) {
            setFormData(prev => ({ ...prev, areas: [...prev.areas, val] }));
            setNewArea('');
        }
    };

    const handleRemoveArea = (areaToRemove: string) => {
        setFormData(prev => ({ ...prev, areas: prev.areas.filter(a => a !== areaToRemove) }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            deliveryFee: 10,
            deliveryTime: '30-45 min',
            minOrder: 30,
            active: true,
            areas: [],
        });
        setEditingZone(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error('Completează toate câmpurile obligatorii');
            return;
        }

        try {
            if (editingZone) {
                await apiClient.updateDeliveryZone(editingZone.id, {
                    name: formData.name,
                    description: formData.description,
                    deliveryFee: formData.deliveryFee,
                    deliveryTime: formData.deliveryTime,
                    minOrder: formData.minOrder,
                    active: formData.active,
                    areas: formData.areas,
                });
                toast.success('Zona de livrare actualizată');
            } else {
                await apiClient.createDeliveryZone({
                    name: formData.name,
                    description: formData.description,
                    deliveryFee: formData.deliveryFee,
                    deliveryTime: formData.deliveryTime,
                    minOrder: formData.minOrder,
                    active: formData.active,
                    areas: formData.areas,
                });
                toast.success('Zona de livrare adăugată');
            }

            await loadZones();
            setIsAddDialogOpen(false);
            resetForm();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la salvare');
        }
    };

    const handleEdit = (zone: DeliveryZone) => {
        setFormData({
            name: zone.name,
            description: zone.description || '',
            deliveryFee: zone.deliveryFee,
            deliveryTime: zone.deliveryTime || '',
            minOrder: zone.minOrder,
            active: zone.active,
            areas: [...(zone.areas || [])],
        });
        setEditingZone(zone);
        setIsAddDialogOpen(true);
    };

    const handleToggleActive = async (zoneId: string | number) => {
        try {
            await apiClient.toggleDeliveryZone(zoneId);
            toast.success('Status zonă actualizat');
            await loadZones();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la actualizare status');
        }
    };

    const handleDelete = async (zoneId: string | number) => {
        try {
            await apiClient.deleteDeliveryZone(zoneId);
            toast.success('Zona de livrare ștearsă');
            await loadZones();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la ștergere');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Zone de livrare</h1>
                    <p className="text-muted-foreground">
                        Gestionează zonele de livrare și tarifele pentru fiecare zonă
                    </p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Adaugă zonă
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingZone ? 'Editează zona de livrare' : 'Adaugă zonă de livrare'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nume zonă *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="ex: Năvodari Centru"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deliveryTime">Timp livrare *</Label>
                                    <Input
                                        id="deliveryTime"
                                        value={formData.deliveryTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                        placeholder="ex: 30-45 min"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descriere *</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Descriere scurtă a zonei"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryFee">Tarif livrare (lei) *</Label>
                                    <Input
                                        id="deliveryFee"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.deliveryFee}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minOrder">Comandă minimă (lei) *</Label>
                                    <Input
                                        id="minOrder"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minOrder}
                                        onChange={(e) => setFormData(prev => ({ ...prev, minOrder: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>

                            {/* Areas */}
                            <div className="space-y-2">
                                <Label>Zone de acoperire</Label>

                                {formData.areas.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.areas.map((area) => (
                                            <Badge key={area} variant="secondary" className="flex items-center gap-1">
                                                {area}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-0 w-4 h-4"
                                                    onClick={() => handleRemoveArea(area)}
                                                >
                                                    ×
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Adaugă zonă (ex: Str. Mihai Viteazu)"
                                        value={newArea}
                                        onChange={(e) => setNewArea(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddArea();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddArea}
                                        disabled={!newArea.trim()}
                                    >
                                        Adaugă
                                    </Button>
                                </div>
                            </div>

                            {/* Active */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    className="rounded"
                                />
                                <Label htmlFor="active">Zonă activă</Label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-4 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddDialogOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Anulează
                                </Button>
                                <Button type="submit">
                                    {editingZone ? 'Actualizează zona' : 'Adaugă zona'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută zone după nume, descriere sau zonă..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                                {zones.length}
                            </p>
                            <p className="text-sm text-muted-foreground">Total zone</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {zones.filter(z => z.active).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Zone active</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--accent))]">
                                {zones.length
                                    ? formatPrice(zones.reduce((s, z) => s + z.deliveryFee, 0) / zones.length)
                                    : formatPrice(0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Tarif mediu</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-muted-foreground">
                                {zones.filter(z => !z.active).length}
                            </p>
                            <p className="text-sm text-muted-foreground">Zone inactive</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Zones Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Zone de livrare ({filteredZones.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Se încarcă zonele...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Zonă</TableHead>
                                    <TableHead>Tarif & Timp</TableHead>
                                    <TableHead>Comandă minimă</TableHead>
                                    <TableHead>Zone acoperite</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredZones.map((zone) => (
                                    <TableRow key={zone.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{zone.name}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {zone.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                                                    <span className="font-semibold text-[hsl(var(--primary))]">
                            {formatPrice(zone.deliveryFee)}
                          </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{zone.deliveryTime || '-'}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-semibold">
                                            {formatPrice(zone.minOrder)}
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {(zone.areas || []).slice(0, 2).map((area) => (
                                                    <Badge key={area} variant="outline" className="text-xs">
                                                        {area}
                                                    </Badge>
                                                ))}
                                                {(zone.areas || []).length > 2 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{(zone.areas || []).length - 2} mai multe
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant={zone.active ? 'default' : 'secondary'}
                                                className={
                                                    zone.active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                                }
                                            >
                                                {zone.active ? 'Activă' : 'Inactivă'}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleActive(zone.id)}
                                                    title={zone.active ? 'Dezactivează' : 'Activează'}
                                                >
                                                    {zone.active ? (
                                                        <Truck className="w-4 h-4" />
                                                    ) : (
                                                        <div className="relative w-4 h-4">
                                                            <Truck className="w-4 h-4 text-muted-foreground" />
                                                            <Slash className="absolute inset-0 w-4 h-4 text-destructive" />
                                                        </div>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(zone)}
                                                    title="Editează"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(zone.id)}
                                                    className="text-destructive hover:text-destructive"
                                                    title="Șterge"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {!loading && filteredZones.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🚚</div>
                            <h3 className="text-lg font-medium mb-2">Nu s-au găsit zone</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery
                                    ? 'Încearcă să modifici termenul de căutare'
                                    : 'Adaugă prima zonă de livrare pentru a începe'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adaugă prima zonă
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">💡 Sfaturi pentru zone de livrare</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Setează tarife diferite în funcție de distanță și dificultate</li>
                        <li>• Folosește comenzi minime mai mari pentru zonele îndepărtate</li>
                        <li>• Adaugă zone specifice pentru cartiere, străzi principale sau repere</li>
                        <li>• Dezactivează temporar zonele în care nu poți livra</li>
                        <li>• Actualizează timpii de livrare în funcție de trafic și sezon</li>
                        <li>• Monitorizează rentabilitatea fiecărei zone și ajustează tarifele</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
