import { useState } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

const PIN_LENGTH = 6;

export default function PinLogin() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { loginPin } = useAuth();

    const handleDigit = (digit: string) => {
        if (pin.length >= PIN_LENGTH || isSubmitting) return;
        const next = pin + digit;
        setPin(next);

        if (next.length === PIN_LENGTH) {
            handleSubmit(next);
        }
    };

    const handleBackspace = () => {
        if (isSubmitting) return;
        setPin((prev) => prev.slice(0, -1));
    };

    const handleSubmit = async (finalPin: string) => {
        setIsSubmitting(true);
        try {
            await loginPin(finalPin);

            toast.success('Autentificare reușită', {
                description: 'Bun venit în panoul de administrare!',
            });
            router.push('/admin');
        } catch (err) {
            toast.error('PIN incorect', {
                description: 'Verifică PIN-ul introdus și încearcă din nou.',
            });
            setPin('');
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
                        Introdu codul PIN pentru a continua
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* PIN dots */}
                    <div className="flex justify-center gap-3">
                        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full border ${
                                    i < pin.length ? 'bg-foreground' : 'border-muted'
                                } transition-all duration-200`}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                        {[...'123456789'].map((digit) => (
                            <Button
                                key={digit}
                                variant="outline"
                                onClick={() => handleDigit(digit)}
                                disabled={isSubmitting}
                                className="text-xl h-14"
                            >
                                {digit}
                            </Button>
                        ))}

                        <div /> {/* empty placeholder */}

                        <Button
                            variant="outline"
                            onClick={() => handleDigit('0')}
                            disabled={isSubmitting}
                            className="text-xl h-14"
                        >
                            0
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleBackspace}
                            disabled={isSubmitting}
                            className="text-xl h-14"
                        >
                            ⌫
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
