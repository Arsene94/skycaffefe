'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function EmailLogin() {
    const router = useRouter();
    const { loginEmail } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = (data: { email: string; password: string }) => {
        const nextErrors: { email?: string; password?: string } = {};
        const email = data.email.trim();

        if (!email) {
            nextErrors.email = 'Emailul este obligatoriu';
        } else {
            // simplu, suficient pentru UI
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                nextErrors.email = 'Email invalid';
            }
        }

        if (!data.password) {
            nextErrors.password = 'Parola este obligatorie';
        } else if (data.password.length < 6) {
            nextErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
        }

        return nextErrors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const nextErrors = validate(formData);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setIsSubmitting(true);
        try {
            await loginEmail(formData.email.trim(), formData.password);
            toast.success('Autentificare reușită', {
                description: 'Bun venit în panoul de administrare!',
            });
            router.push('/admin');
        } catch (error: any) {
            // Afișează eroare generică + setează pe câmpuri
            setErrors({
                email: undefined,
                password: 'Email sau parolă incorecte',
            });
            toast.error('Autentificare eșuată', {
                description: error?.message || 'Verifică datele și încearcă din nou.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-[hsl(var(--primary))]" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Acces Administrator</CardTitle>
                    <p className="text-muted-foreground">
                        Autentifică-te cu email și parolă pentru a continua
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ex: admin@exemplu.ro"
                                autoComplete="email"
                                disabled={isSubmitting}
                                className={errors.email ? 'border-destructive' : ''}
                                value={formData.email}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => ({ ...prev, email: value }));
                                    if (errors.email) {
                                        const v = validate({ ...formData, email: value });
                                        if (!v.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }
                                }}
                                onBlur={() => {
                                    const v = validate(formData);
                                    setErrors((prev) => ({ ...prev, email: v.email }));
                                }}
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                            />
                            {errors.email && (
                                <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Parola</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Introdu parola"
                                    autoComplete="current-password"
                                    disabled={isSubmitting}
                                    className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                                    value={formData.password}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => ({ ...prev, password: value }));
                                        if (errors.password) {
                                            const v = validate({ ...formData, password: value });
                                            if (!v.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                        }
                                    }}
                                    onBlur={() => {
                                        const v = validate(formData);
                                        setErrors((prev) => ({ ...prev, password: v.password }));
                                    }}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? 'Ascunde parola' : 'Afișează parola'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Minim 6 caractere.</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Se autentifică...' : 'Autentificare'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
