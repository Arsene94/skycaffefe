'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Plus, Search, Trash2, Link as LinkIcon, Copy, Download } from 'lucide-react';
import apiClient from '@/lib/api';
import { cn } from '@/lib/utils';

type QrMode = 'redirect' | 'info';

// Dot types (qr-code-styling)
const DOT_TYPES = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'] as const;
const CORNER_SQUARE_TYPES = ['square', 'dot', 'extra-rounded'] as const;
const CORNER_DOT_TYPES = ['square', 'dot'] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

type QrItem = {
    id: number;
    uuid: string;
    type: 'redirect' | 'info';
    url?: string | null;
    data?: Record<string, any> | null;
    branding?: any;
    created_at?: string;
};

export default function AdminQrPage() {
    // -------- listă qr ----------
    const [items, setItems] = useState<QrItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const loadList = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getAdminQrs({ search: debounced, page, pageSize: PAGE_SIZE });
            const data = res?.data ?? [];
            setItems(data);
            setTotal(res?.total ?? data.length);
            setPage(res?.current_page ?? page);
            setLastPage(res?.last_page ?? 1);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea codurilor QR');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadList(); }, [debounced, page]); // eslint-disable-line react-hooks/exhaustive-deps

    const startIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);
    const endIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + items.length), [page, total, items.length]);
    const goTo = (p: number) => setPage(Math.max(1, Math.min(lastPage, p)));

    const copyUrl = async (uuid: string) => {
        const base =
            SITE_URL ||
            (typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : '');
        const url = `${base}/qr/${uuid}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copiat');
        } catch {
            toast.error('Nu am putut copia link-ul');
        }
    };

    const del = async (id: number) => {
        if (!confirm('Ștergi acest QR?')) return;
        try {
            await apiClient.deleteQr(id);
            toast.success('Șters');
            loadList();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la ștergere');
        }
    };

    // ------- builder toggle ------
    const [showBuilder, setShowBuilder] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">QR Codes</h1>
                    <p className="text-muted-foreground">Gestionează codurile QR; adaugă noi sau editează parametrii (UUID, culori, logo etc.)</p>
                </div>
                <Button onClick={() => setShowBuilder((s) => !s)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {showBuilder ? 'Ascunde creatorul' : 'Adaugă cod nou'}
                </Button>
            </div>

            {/* search + list */}
            <Card>
                <CardHeader>
                    <CardTitle>Caută & Listează</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută după uuid, url, tip..." className="pl-9" />
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>UUID</TableHead>
                                    <TableHead>Tip</TableHead>
                                    <TableHead>Destinație</TableHead>
                                    <TableHead>Creat</TableHead>
                                    <TableHead className="text-right">Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <div className="py-8 text-center text-muted-foreground">Nimic de afișat.</div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && items.map(it => (
                                    <TableRow key={it.id}>
                                        <TableCell className="font-mono text-xs">{it.uuid}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{it.type}</Badge>
                                        </TableCell>
                                        <TableCell className="truncate max-w-[280px]">
                                            {it.type === 'redirect'
                                                ? (it.url || '-')
                                                : (it?.data?.name || it?.data?.title || '(info)')}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {it.created_at ? new Date(it.created_at).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => copyUrl(it.uuid)}>
                                                <LinkIcon className="w-4 h-4 mr-1" /> Copiază link
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => copyUrl(it.uuid)} title="Copie link">
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => del(it.id)}>
                                                <Trash2 className="w-4 h-4 mr-1" /> Șterge
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {total > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div>Afișează <span className="font-medium">{startIndex}</span>–<span className="font-medium">{endIndex}</span> din <span className="font-medium">{total}</span></div>
                            <div className="space-x-2">
                                <Button size="sm" variant="outline" onClick={() => goTo(1)} disabled={page <= 1}>«</Button>
                                <Button size="sm" variant="outline" onClick={() => goTo(page - 1)} disabled={page <= 1}>‹</Button>
                                <span>Pagina {page}/{lastPage}</span>
                                <Button size="sm" variant="outline" onClick={() => goTo(page + 1)} disabled={page >= lastPage}>›</Button>
                                <Button size="sm" variant="outline" onClick={() => goTo(lastPage)} disabled={page >= lastPage}>»</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showBuilder && <QrBuilder onSaved={() => { setShowBuilder(false); loadList(); }} />}
        </div>
    );
}

/* =========================
   QrBuilder (creatorul)
   ========================= */
function QrBuilder({ onSaved }: { onSaved: () => void }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const qrRef = useRef<any>(null);

    const [mode, setMode] = useState<QrMode>('redirect');
    const [redirectUrl, setRedirectUrl] = useState<string>('');

    const [infoName, setInfoName] = useState('');
    const [infoDesc, setInfoDesc] = useState('');
    const [infoPhone, setInfoPhone] = useState('');
    const [infoEmail, setInfoEmail] = useState('');
    const [infoWebsite, setInfoWebsite] = useState('');

    const [label, setLabel] = useState('sky-caffe-qr');
    const [size, setSize] = useState<{ w: number; h: number }>({ w: 280, h: 280 });
    const [bgColor, setBgColor] = useState('#ffffff');
    const [fgColor, setFgColor] = useState('#111827');
    const [dotType, setDotType] = useState<typeof DOT_TYPES[number]>('rounded');
    const [cornerSquareType, setCornerSquareType] = useState<typeof CORNER_SQUARE_TYPES[number]>('extra-rounded');
    const [cornerDotType, setCornerDotType] = useState<typeof CORNER_DOT_TYPES[number]>('dot');

    const [logoUrl, setLogoUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [uuid, setUuid] = useState('');
    const scanUrl = useMemo(() => {
        const base =
            SITE_URL ||
            (typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}`
                : 'https://example.com');
        return uuid ? `${base}/qr/${uuid}` : '';
    }, [uuid]);

    // init QR instance
    useEffect(() => {
        let mounted = true;
        (async () => {
            const QRCodeStyling = (await import('qr-code-styling')).default;
            if (!mounted || !containerRef.current || qrRef.current) return;

            const inst = new QRCodeStyling({
                width: size.w,
                height: size.h,
                type: 'svg',
                data: scanUrl || 'https://skycaffe.example',
                image: logoUrl || undefined,
                imageOptions: { crossOrigin: 'anonymous', margin: 5 },
                dotsOptions: { color: fgColor, type: dotType },
                backgroundOptions: { color: bgColor },
                cornersSquareOptions: { type: cornerSquareType, color: fgColor },
                cornersDotOptions: { type: cornerDotType, color: fgColor },
            });
            inst.append(containerRef.current);
            qrRef.current = inst;
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // update QR on changes
    useEffect(() => {
        if (!qrRef.current) return;
        qrRef.current.update({
            width: size.w,
            height: size.h,
            data: scanUrl || 'https://skycaffe.example',
            image: logoUrl || undefined,
            dotsOptions: { color: fgColor, type: dotType },
            backgroundOptions: { color: bgColor },
            cornersSquareOptions: { type: cornerSquareType, color: fgColor },
            cornersDotOptions: { type: cornerDotType, color: fgColor },
        });
    }, [size, scanUrl, logoUrl, fgColor, bgColor, dotType, cornerSquareType, cornerDotType]);

    const genUuid = () => {
        const id =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : nanoid();
        setUuid(id);
        toast.success('UUID generat');
    };

    const onLogoPicked: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setLogoUrl(event.target?.result as string);
        reader.readAsDataURL(file);
        e.currentTarget.value = '';
    };

    const clearLogo = () => setLogoUrl('');

    const downloadPng = () => qrRef.current?.download({ name: label || 'qr-code', extension: 'png' });
    const downloadSvg = () => qrRef.current?.download({ name: label || 'qr-code', extension: 'svg' });

    const previewPayload = useMemo(() => {
        if (mode === 'redirect') {
            return { type: 'redirect' as const, url: redirectUrl || null, data: null };
        }
        return {
            type: 'info' as const,
            url: null,
            data: {
                name: infoName || null,
                description: infoDesc || null,
                phone: infoPhone || null,
                email: infoEmail || null,
                website: infoWebsite || null,
            },
        };
    }, [mode, redirectUrl, infoName, infoDesc, infoPhone, infoEmail, infoWebsite]);

    const saveToBackend = async () => {
        try {
            if (!uuid) return toast.error('Generează mai întâi UUID');
            if (mode === 'redirect' && !redirectUrl) return toast.error('Introdu URL-ul pentru redirect');

            const branding = {
                size,
                bgColor,
                fgColor,
                dotType,
                cornerSquareType,
                cornerDotType,
                logo: !!logoUrl,
            };

            const payload = {
                uuid,
                type: mode,
                url: previewPayload.type === 'redirect' ? previewPayload.url : null,
                data: previewPayload.type === 'info' ? previewPayload.data : null,
                branding,
            };

            await apiClient.createQr(payload);
            toast.success('QR salvat');
            onSaved();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la salvare');
        }
    };

    const copyScanUrl = async () => {
        if (!scanUrl) return;
        try { await navigator.clipboard.writeText(scanUrl); toast.success('Link copiat'); }
        catch { toast.error('Nu am putut copia link-ul'); }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Creare cod nou</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadSvg}><Download className="w-4 h-4 mr-2" />SVG</Button>
                    <Button onClick={downloadPng}><Download className="w-4 h-4 mr-2" />PNG</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* stânga: opțiuni */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Conținut</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="mb-2 block">Tip conținut</Label>
                                    <RadioGroup
                                        value={mode}
                                        onValueChange={(v) => setMode(v as QrMode)}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        <Label className={cn('border rounded-md p-3 cursor-pointer', mode === 'redirect' && 'ring-2 ring-primary')}>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="redirect" id="qr-rd" />
                                                <span>Redirect (URL)</span>
                                            </div>
                                        </Label>
                                        <Label className={cn('border rounded-md p-3 cursor-pointer', mode === 'info' && 'ring-2 ring-primary')}>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="info" id="qr-info" />
                                                <span>Informații</span>
                                            </div>
                                        </Label>
                                    </RadioGroup>
                                </div>

                                {mode === 'redirect' ? (
                                    <div className="space-y-1">
                                        <Label>URL de redirect *</Label>
                                        <Input placeholder="https://exemplu.ro/promo" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label>Nume</Label>
                                            <Input value={infoName} onChange={(e) => setInfoName(e.target.value)} placeholder="ex: Sky Caffe - Promo" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Telefon</Label>
                                            <Input value={infoPhone} onChange={(e) => setInfoPhone(e.target.value)} placeholder="07xx xxx xxx" />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <Label>Descriere</Label>
                                            <Textarea value={infoDesc} onChange={(e) => setInfoDesc(e.target.value)} placeholder="Detalii promo/reducere..." />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Email</Label>
                                            <Input value={infoEmail} onChange={(e) => setInfoEmail(e.target.value)} placeholder="contact@exemplu.ro" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Website</Label>
                                            <Input value={infoWebsite} onChange={(e) => setInfoWebsite(e.target.value)} placeholder="https://exemplu.ro" />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">Personalizare</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                        <Label>Lățime</Label>
                                        <Input type="number" min={120} max={1024} value={size.w} onChange={(e) => setSize(s => ({...s, w: parseInt(e.target.value || '0', 10)}))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Înălțime</Label>
                                        <Input type="number" min={120} max={1024} value={size.h} onChange={(e) => setSize(s => ({...s, h: parseInt(e.target.value || '0', 10)}))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Culoare față</Label>
                                        <Input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Fundal</Label>
                                        <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label>Dots</Label>
                                        <Select value={dotType} onValueChange={(v) => setDotType(v as any)}>
                                            <SelectTrigger><SelectValue placeholder="Tip dots" /></SelectTrigger>
                                            <SelectContent>
                                                {DOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Colțuri (square)</Label>
                                        <Select value={cornerSquareType} onValueChange={(v) => setCornerSquareType(v as any)}>
                                            <SelectTrigger><SelectValue placeholder="Tip colțuri" /></SelectTrigger>
                                            <SelectContent>
                                                {CORNER_SQUARE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Puncte colț</Label>
                                        <Select value={cornerDotType} onValueChange={(v) => setCornerDotType(v as any)}>
                                            <SelectTrigger><SelectValue placeholder="Tip puncte" /></SelectTrigger>
                                            <SelectContent>
                                                {CORNER_DOT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-1">
                                    <Label>Logo (opțional)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="file" accept="image/*" ref={fileInputRef} onChange={onLogoPicked} />
                                        {logoUrl && <Button variant="outline" onClick={clearLogo}>Elimină logo</Button>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label>Nume fișier</Label>
                                    <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="sky-caffe-qr" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* dreapta: preview + acțiuni */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Button onClick={genUuid} variant="outline">Generează UUID</Button>
                                    <Input value={uuid} onChange={(e) => setUuid(e.target.value)} placeholder="uuid" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link scan (se encodează în QR)</Label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={scanUrl} />
                                        <Button variant="outline" onClick={copyScanUrl}><LinkIcon className="w-4 h-4 mr-1" /> Copiază</Button>
                                    </div>
                                </div>

                                <div className="mx-auto mt-2 border rounded-md p-3 flex items-center justify-center" style={{ minHeight: 320 }}>
                                    <div ref={containerRef} />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={downloadPng}><Download className="w-4 h-4 mr-2" /> PNG</Button>
                                    <Button variant="outline" onClick={downloadSvg}><Download className="w-4 h-4 mr-2" /> SVG</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base">Salvare</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full" onClick={saveToBackend}>Salvează în backend</Button>
                                <pre className="text-xs overflow-auto p-3 bg-muted rounded-md">
{JSON.stringify({ uuid, ...previewPayload, branding: { size, bgColor, fgColor, dotType, cornerSquareType, cornerDotType, logo: !!logoUrl } }, null, 2)}
                </pre>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
