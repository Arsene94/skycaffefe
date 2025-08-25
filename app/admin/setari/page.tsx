'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import {
    AppSettings,
    SETTINGS_DEFAULTS,
    WeekDay,
    WORKING_HOURS_DEFAULTS,
    DayHours,
} from '@/types';

// română
const dayNames: Record<WeekDay, string> = {
    monday: 'Luni',
    tuesday: 'Marți',
    wednesday: 'Miercuri',
    thursday: 'Joi',
    friday: 'Vineri',
    saturday: 'Sâmbătă',
    sunday: 'Duminică',
};
const dayOrder: WeekDay[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
    const [newPhone, setNewPhone] = useState('');

    // calculează rezumat zile active: „Luni–Vineri; Duminică”
    const activeDaysLabel = useMemo(() => {
        const wh =
            settings.availability?.workingHours ||
            WORKING_HOURS_DEFAULTS.workingHours;

        const enabled = dayOrder.map((d) => ({
            day: d,
            enabled: !!wh[d]?.enabled,
        }));

        const chunks: { start: WeekDay; end: WeekDay }[] = [];
        let start: WeekDay | null = null;

        for (let i = 0; i < enabled.length; i++) {
            const { day, enabled: en } = enabled[i];
            if (en && start == null) start = day;
            const next = enabled[i + 1]?.enabled ?? false;
            if (en && (!next || i === enabled.length - 1)) {
                chunks.push({ start: start!, end: day });
                start = null;
            }
            if (!en) start = null;
        }

        if (chunks.length === 0) return 'Închis complet';
        const parts = chunks.map(({ start, end }) => {
            return start === end ? dayNames[start] : `${dayNames[start]}–${dayNames[end]}`;
        });
        return parts.join('; ');
    }, [settings.availability]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await apiClient.getAdminSettings();
                const raw = (res?.data ?? res) as Partial<AppSettings>;
                const merged: AppSettings = {
                    ...SETTINGS_DEFAULTS,
                    ...(raw || {}),
                };

                // normalizează lista whatsapp
                merged.notify_whatsapp_numbers = Array.isArray(
                    merged.notify_whatsapp_numbers
                )
                    ? merged.notify_whatsapp_numbers.map(String).filter(Boolean)
                    : [];

                // normalizează availability
                const wh = merged.availability?.workingHours || {};
                const filled: any = { ...WORKING_HOURS_DEFAULTS.workingHours };
                for (const d of dayOrder) {
                    const v: DayHours = {
                        enabled:
                            wh?.[d]?.enabled ??
                            WORKING_HOURS_DEFAULTS.workingHours[d].enabled,
                        start:
                            wh?.[d]?.start ?? WORKING_HOURS_DEFAULTS.workingHours[d].start,
                        end: wh?.[d]?.end ?? WORKING_HOURS_DEFAULTS.workingHours[d].end,
                    };
                    filled[d] = v;
                }
                merged.availability = { workingHours: filled };

                setSettings(merged);
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
        setSettings((s) => ({
            ...s,
            notify_whatsapp_numbers: [...s.notify_whatsapp_numbers, ph],
        }));
        setNewPhone('');
    };

    const removePhone = (idx: number) => {
        setSettings((s) => {
            const arr = [...s.notify_whatsapp_numbers];
            arr.splice(idx, 1);
            return { ...s, notify_whatsapp_numbers: arr };
        });
    };

    function updateWorkingHours(
        day: WeekDay,
        key: keyof DayHours,
        value: boolean | string
    ) {
        setSettings((s) => {
            const prev =
                s.availability?.workingHours ?? WORKING_HOURS_DEFAULTS.workingHours;
            const nextForDay: DayHours = {
                enabled: key === 'enabled' ? Boolean(value) : prev[day]?.enabled ?? false,
                start: key === 'start' ? String(value) : prev[day]?.start ?? '09:00',
                end: key === 'end' ? String(value) : prev[day]?.end ?? '18:00',
            };
            return {
                ...s,
                availability: {
                    workingHours: {
                        ...prev,
                        [day]: nextForDay,
                    },
                },
            };
        });
    }

    const save = async () => {
        try {
            setSaving(true);
            const payload: AppSettings = { ...settings };
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
                <p className="text-muted-foreground">
                    Configurează datele generale, programul de lucru și notificările
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex flex-wrap gap-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="program">Program</TabsTrigger>
                    <TabsTrigger value="plati">Plăți</TabsTrigger>
                    <TabsTrigger value="notificari">Notificări</TabsTrigger>
                </TabsList>

                {/* GENERAL */}
                <TabsContent value="general" className="mt-4 space-y-6">
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
                                <Label>Scurtă descriere / Motto</Label>
                                <Input
                                    value={settings.business_short ?? ''}
                                    onChange={(e) =>
                                        setSettings({ ...settings, business_short: e.target.value })
                                    }
                                    placeholder="bistro la înălțime..."
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
                                            pickup_address: e.target.value || null,
                                        })
                                    }
                                    placeholder="Str. Exemplu 10, Iași"
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROGRAM */}
                <TabsContent value="program" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Program de lucru</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-md border p-3 text-sm text-muted-foreground">
                                Zile active:{' '}
                                <span className="font-medium text-foreground">
                  {activeDaysLabel}
                </span>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(
                                    settings.availability?.workingHours ??
                                    WORKING_HOURS_DEFAULTS.workingHours
                                ).map(([day, hours]) => (
                                    <div
                                        key={day}
                                        className="flex items-center gap-4 flex-wrap"
                                    >
                                        <div className="w-28 text-sm font-medium">
                                            {dayNames[day as WeekDay]}
                                        </div>
                                        <Switch
                                            checked={!!(hours as DayHours).enabled}
                                            onCheckedChange={(checked) =>
                                                updateWorkingHours(day as WeekDay, 'enabled', checked)
                                            }
                                        />
                                        {(hours as DayHours).enabled && (
                                            <>
                                                <Input
                                                    type="time"
                                                    value={(hours as DayHours).start}
                                                    onChange={(e) =>
                                                        updateWorkingHours(
                                                            day as WeekDay,
                                                            'start',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-28"
                                                />
                                                <span className="text-muted-foreground">-</span>
                                                <Input
                                                    type="time"
                                                    value={(hours as DayHours).end}
                                                    onChange={(e) =>
                                                        updateWorkingHours(
                                                            day as WeekDay,
                                                            'end',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-28"
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PLĂȚI */}
                <TabsContent value="plati" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metode de plată</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOTIFICĂRI */}
                <TabsContent value="notificari" className="mt-4 space-y-6">
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
                                        <div className="font-medium">
                                            Notificare la modificarea comenzii
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Trimite notificări când cineva editează o comandă (status,
                                            produse etc.)
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
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={save} disabled={disableSave}>
                    {saving ? 'Se salvează...' : 'Salvează setările'}
                </Button>
            </div>
        </div>
    );
}
