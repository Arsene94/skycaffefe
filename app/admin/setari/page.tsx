'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';

type AppSettings = {
    business_name: string;
    site_email: string | null;
    support_phone: string | null;
    notify_whatsapp_numbers: string[];
    notify_on_new_order: boolean;
    notify_on_order_update: boolean; // 🆕
    order_auto_confirm: boolean;
    accept_cash: boolean;
    accept_card: boolean;
    pickup_address: string | null;
    timezone: string;
    currency: string;
};

const DEFAULTS: AppSettings = {
    business_name: '',
    site_email: null,
    support_phone: null,
    notify_whatsapp_numbers: [],
    notify_on_new_order: true,
    notify_on_order_update: true, // 🆕
    order_auto_confirm: false,
    accept_cash: true,
    accept_card: true,
    pickup_address: null,
    timezone: 'Europe/Bucharest',
    currency: 'RON',
};

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
    const [newPhone, setNewPhone] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await apiClient.getAdminSettings();
                const s: AppSettings = { ...DEFAULTS, ...(res ?? {}) };

                // normalizăm array-ul
                s.notify_whatsapp_numbers = Array.isArray(s.notify_whatsapp_numbers)
                    ? s.notify_whatsapp_numbers.map((x: any) => String(x)).filter(Boolean)
                    : [];
                setSettings(s);
            } catch (e: any) {
                console.error(e);
                toast.error(e?.message || 'Nu s-au putut încărca setările');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const addPhone = () => {
        const ph = newPhone.trim();
        if (!ph) return;
        if (settings.notify_whatsapp_numbers.includes(ph)) {
            toast.message('Numărul există deja în listă');
            return;
        }
        setSettings({
            ...settings,
            notify_whatsapp_numbers: [...settings.notify_whatsapp_numbers, ph],
        });
        setNewPhone('');
    };

    const removePhone = (idx: number) => {
        const arr = [...settings.notify_whatsapp_numbers];
        arr.splice(idx, 1);
        setSettings({ ...settings, notify_whatsapp_numbers: arr });
    };

    const save = async () => {
        try {
            setSaving(true);
            const payload = { ...settings };
            await apiClient.updateAdminSettings(payload);
            toast.success('Setări salvate');
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la salvarea setărilor');
        } finally {
            setSaving(false);
        }
    };

    const disableSave = useMemo(() => loading || saving, [loading, saving]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Setări aplicație</h1>
                <p className="text-muted-foreground">Configurează datele generale și notificările</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Date generale</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Denumire business</Label>
                        <Input
                            value={settings.business_name}
                            onChange={(e) =>
                                setSettings({ ...settings, business_name: e.target.value })
                            }
                            placeholder="Sky Caffe"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <Label>Email site</Label>
                        <Input
                            type="email"
                            value={settings.site_email ?? ''}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    site_email: e.target.value.trim() || null,
                                })
                            }
                            placeholder="contact@exemplu.ro"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <Label>Telefon suport</Label>
                        <Input
                            value={settings.support_phone ?? ''}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    support_phone: e.target.value.trim() || null,
                                })
                            }
                            placeholder="07xx xxx xxx"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <Label>Adresă pentru ridicare (pickup)</Label>
                        <Input
                            value={settings.pickup_address ?? ''}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    pickup_address: e.target.value.trim() || null,
                                })
                            }
                            placeholder="Str. Exemplu 10, Iași"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Label>Timezone</Label>
                        <Input
                            value={settings.timezone}
                            onChange={(e) =>
                                setSettings({ ...settings, timezone: e.target.value })
                            }
                            placeholder="Europe/Bucharest"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <Label>Monedă</Label>
                        <Input
                            value={settings.currency}
                            onChange={(e) =>
                                setSettings({ ...settings, currency: e.target.value })
                            }
                            placeholder="RON"
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notificări & Comenzi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="font-medium">Notificare la comenzi noi</div>
                                <div className="text-sm text-muted-foreground">
                                    Trimite notificări către destinatarii configurați
                                </div>
                            </div>
                            <Switch
                                checked={settings.notify_on_new_order}
                                onCheckedChange={(v) =>
                                    setSettings({ ...settings, notify_on_new_order: v })
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="font-medium">Notificare la modificarea comenzii</div>
                                <div className="text-sm text-muted-foreground">
                                    Trimite notificări când cineva editează o comandă (status, produse etc.)
                                </div>
                            </div>
                            <Switch
                                checked={settings.notify_on_order_update}
                                onCheckedChange={(v) =>
                                    setSettings({ ...settings, notify_on_order_update: v })
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="font-medium">Autoconfirmă comanda</div>
                                <div className="text-sm text-muted-foreground">
                                    Trece comanda direct în &quot;confirmată&quot;
                                </div>
                            </div>
                            <Switch
                                checked={settings.order_auto_confirm}
                                onCheckedChange={(v) =>
                                    setSettings({ ...settings, order_auto_confirm: v })
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="font-medium">Plată numerar</div>
                                <div className="text-sm text-muted-foreground">Acceptă cash</div>
                            </div>
                            <Switch
                                checked={settings.accept_cash}
                                onCheckedChange={(v) =>
                                    setSettings({ ...settings, accept_cash: v })
                                }
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="font-medium">Plată card</div>
                                <div className="text-sm text-muted-foreground">Acceptă card</div>
                            </div>
                            <Switch
                                checked={settings.accept_card}
                                onCheckedChange={(v) =>
                                    setSettings({ ...settings, accept_card: v })
                                }
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Numere WhatsApp pentru notificări</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="07xx xxx xxx"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                disabled={loading}
                            />
                            <Button type="button" onClick={addPhone} disabled={loading}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adaugă
                            </Button>
                        </div>

                        {settings.notify_whatsapp_numbers.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {settings.notify_whatsapp_numbers.map((ph, idx) => (
                                    <Badge
                                        key={`${ph}-${idx}`}
                                        variant="secondary"
                                        className="flex items-center gap-2"
                                    >
                                        {ph}
                                        <button
                                            type="button"
                                            className="ml-1"
                                            onClick={() => removePhone(idx)}
                                            title="Șterge"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                N-ai adăugat încă destinatari WhatsApp.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={save} disabled={disableSave}>
                    {saving ? 'Se salvează...' : 'Salvează setările'}
                </Button>
            </div>
        </div>
    );
}
