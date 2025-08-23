// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {useAuth} from "@/contexts/auth-context";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        city: '',
        address: '',
        label: 'Acasă',
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form);
            toast.success('Cont creat! Te-am autentificat automat.');
            router.push('/'); // sau /account
        } catch (e: any) {
            toast.error(e?.message || 'Nu am putut crea contul');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-10 w-[50%]">
                <Card>
                    <CardHeader>
                        <CardTitle>Crează cont</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nume</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon</Label>
                                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Parolă</Label>
                                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                            </div>

                            {/* Adresa opțională */}
                            <div className="space-y-2">
                                <Label>Oraș</Label>
                                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Adresă</Label>
                                <Input placeholder="Strada, nr, bloc, ap..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Etichetă adresă</Label>
                                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Se creează...' : 'Creează cont'}
                            </Button>

                            <p className="text-sm text-muted-foreground text-center">
                                Ai deja cont? <Link href="/auth/login" className="underline">Autentifică-te</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
