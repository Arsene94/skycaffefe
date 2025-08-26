'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartSheet } from '@/components/cart/cart-sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api';
import { MapPin, Star, Pencil, Trash } from 'lucide-react';

type ClientAddress = {
    id: string | number;
    city: string;
    address: string;
    label?: string | null;
    is_default?: boolean;
    lat?: number | null;
    lng?: number | null;
};

export default function AddressesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [items, setItems] = useState<ClientAddress[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ClientAddress | null>(null);

    const [city, setCity] = useState('');
    const [addr, setAddr] = useState('');
    const [label, setLabel] = useState('');
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login?returnTo=/account/addresses');
        }
    }, [loading, user, router]);

    const load = async () => {
        try {
            setLoadingList(true);
            const res = await apiClient.getMyAddresses();
            const list = Array.isArray(res) ? res : res?.data || [];
            setItems(list);
        } catch {
            setItems([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (user) load();
    }, [user]);

    const resetForm = () => {
        setCity('');
        setAddr('');
        setLabel('');
    };

    const openAdd = () => {
        setEditing(null);
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (a: ClientAddress) => {
        setEditing(a);
        setCity(a.city || '');
        setAddr(a.address || '');
        setLabel(a.label || '');
        setDialogOpen(true);
    };

    const canSave = useMemo(() => city.trim() && addr.trim(), [city, addr]);
    if (!isClient) return null;

    const handleSave = async () => {
        try {
            const payload = { city: city.trim(), address: addr.trim(), label: label.trim() || null };
            if (editing) {
                await apiClient.updateAddress(editing.id, payload);
                toast.success('Adresă actualizată');
            } else {
                await apiClient.createAddress(payload);
                toast.success('Adresă adăugată');
            }
            setDialogOpen(false);
            await load();
        } catch (e: any) {
            toast.error(e?.message || 'Nu am putut salva adresa');
        }
    };

    const handleDelete = async (id: string | number) => {
        try {
            await apiClient.deleteAddress(id);
            toast.success('Adresă ștearsă');
            await load();
        } catch (e: any) {
            toast.error(e?.message || 'Nu am putut șterge adresa');
        }
    };

    const handleMakeDefault = async (id: string | number) => {
        try {
            await apiClient.setDefaultAddress(id);
            toast.success('Setată ca implicită');
            await load();
        } catch (e: any) {
            toast.error(e?.message || 'Nu am putut seta adresa implicită');
        }
    };

    if (loading || !user) {
        return (
            <>
                <Header />
                <CartSheet />
                <div className="container mx-auto px-4 py-12">
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">Se încarcă...</CardContent>
                    </Card>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <CartSheet />
            <div className="container mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Adresele mele</h1>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openAdd}>Adaugă adresă</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editing ? 'Editează adresa' : 'Adaugă adresă'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Oraș</Label>
                                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="ex: Năvodari" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Adresă completă</Label>
                                    <Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Str. Mihai Viteazu nr..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Etichetă (opțional)</Label>
                                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex: Acasă / Birou" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
                                    <Button onClick={handleSave} disabled={!canSave}>{editing ? 'Salvează' : 'Adaugă'}</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de adrese</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingList && <div className="text-sm text-muted-foreground">Se încarcă...</div>}
                        {!loadingList && items.length === 0 && (
                            <div className="text-sm text-muted-foreground">Nu există adrese salvate.</div>
                        )}
                        {items.map((a) => (
                            <div key={String(a.id)} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <div className="font-medium">
                                            {a.label ? `${a.label} — ` : ''}{a.city}, {a.address}
                                        </div>
                                        {a.is_default && <Badge variant="secondary" className="mt-1"><Star className="w-3 h-3 mr-1" /> Implicită</Badge>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!a.is_default && (
                                        <Button variant="outline" size="sm" onClick={() => handleMakeDefault(a.id)}>
                                            Setează implicită
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
