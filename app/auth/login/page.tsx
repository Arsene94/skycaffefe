// app/auth/login/page.tsx
'use client';

import {useEffect, useState} from 'react';
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

export default function LoginPage() {
    const router = useRouter();
    const [loadingEmail, setLoadingEmail] = useState(false);
    const { loginEmail } = useAuth();
    const [emailForm, setEmailForm] = useState({ email: '', password: '' });
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);
    const loginEmailHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingEmail(true);
        try {
            await loginEmail(emailForm.email, emailForm.password);
            toast.success('Autentificat!');
            router.push('/');
        } catch (e: any) {
            toast.error(e?.message || 'Login eșuat');
        } finally {
            setLoadingEmail(false);
        }
    };
    if (!isClient) return null;

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-10 w-[50%]">
                {/* Email + parolă */}
                <Card>
                    <CardHeader>
                        <CardTitle>Autentificare (Email)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={loginEmailHandler} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={emailForm.email}
                                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Parolă</Label>
                                <Input
                                    type="password"
                                    value={emailForm.password}
                                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loadingEmail}>
                                {loadingEmail ? 'Se autentifică...' : 'Autentificare'}
                            </Button>

                            <p className="text-sm text-muted-foreground text-center">
                                Nu ai cont? <Link href="/auth/register" className="underline">Înregistrează-te</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </>
    );
}
