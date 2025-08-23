'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Search, UserPlus, Mail, Phone,
    ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
    Shield, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { formatShortDate } from '@/lib/format';

type StaffUser = {
    id: number | string;
    name: string;
    email: string | null;
    phone: string | null;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    created_at: string;
};

const ROLE_BADGE: Record<string, { label: string; color: string; icon: any }> = {
    ADMIN:   { label: 'Admin',   color: 'bg-red-500/10 text-red-700 dark:text-red-300',   icon: ShieldAlert },
    MANAGER: { label: 'Manager', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', icon: Shield },
    EMPLOYEE:{ label: 'Employee',color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', icon: ShieldCheck },
};

export default function AdminPersonalPage() {
    const [me, setMe] = useState<any>(null);
    const [canCreateManager, setCanCreateManager] = useState(false);
    const [canCreateEmployee, setCanCreateEmployee] = useState(false);

    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [loading, setLoading] = useState(true);

    const [list, setList] = useState<StaffUser[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<{ name: string; email: string; phone: string; role: 'MANAGER' | 'EMPLOYEE'; pin: string }>({
        name: '', email: '', phone: '', role: 'EMPLOYEE', pin: '',
    });

    // debounce
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 400);
        return () => clearTimeout(t);
    }, [search]);

    // load me
    useEffect(() => {
        (async () => {
            try {
                const prof = await apiClient.getProfile();
                setMe(prof);
                const r = prof?.role || prof?.data?.role; // în funcție de cum expune backend
                setCanCreateManager(r === 'ADMIN');
                setCanCreateEmployee(r === 'ADMIN' || r === 'MANAGER');
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    // load staff
    const loadStaff = async () => {
        try {
            setLoading(true);
            const res = await apiClient.getStaff({ search: debounced || '', page, pageSize: PAGE_SIZE });
            const raw = res?.data ?? res ?? [];
            const normalized: StaffUser[] = raw.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email ?? null,
                phone: u.phone ?? null,
                role: u.role,
                created_at: u.created_at,
            }));
            setList(normalized);
            setTotal(res?.total ?? normalized.length);
            setPage(res?.current_page ?? page);
            setLastPage(res?.last_page ?? 1);
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Eroare la încărcarea personalului');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStaff(); /* eslint-disable-next-line */ }, [page, debounced]);

    // pagination helpers
    const startIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);
    const endIndex = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + list.length), [page, total, list.length]);
    const goToPage = (p: number) => {
        const np = Math.max(1, Math.min(lastPage, p));
        if (np !== page) setPage(np);
    };
    const pageButtons = useMemo(() => {
        const maxBtns = 5;
        let start = Math.max(1, page - Math.floor(maxBtns / 2));
        let end = Math.min(lastPage, start + maxBtns - 1);
        if (end - start + 1 < maxBtns) start = Math.max(1, end - maxBtns + 1);
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
    }, [page, lastPage]);

    // create dialog controls
    const allowedRoles: ('MANAGER' | 'EMPLOYEE')[] = useMemo(() => {
        if (canCreateManager) return ['MANAGER', 'EMPLOYEE'];
        if (canCreateEmployee) return ['EMPLOYEE'];
        return [];
    }, [canCreateManager, canCreateEmployee]);

    const generatePin = () => {
        const p = Math.floor(1000 + Math.random() * 9000); // 4 digits
        setForm((f) => ({ ...f, pin: String(p) }));
    };

    const submitCreate = async () => {
        if (!form.name.trim()) return toast.error('Numele este obligatoriu');
        if (!form.pin || form.pin.length < 4) return toast.error('PIN-ul trebuie să aibă cel puțin 4 cifre');

        try {
            setCreating(true);
            await apiClient.createStaff({
                name: form.name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                role: form.role,
                pin: form.pin.trim(),
            });
            toast.success('Utilizator creat');
            setCreateOpen(false);
            setForm({ name: '', email: '', phone: '', role: 'EMPLOYEE', pin: '' });
            await loadStaff();
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || 'Nu am putut crea utilizatorul');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">Personal</h1>
                    <p className="text-muted-foreground">
                        {me?.role === 'ADMIN' ? 'Admin: vezi Admini, Manageri și Employees' :
                            me?.role === 'MANAGER' ? 'Manager: vezi doar Employees' :
                                'Personal'}
                    </p>
                </div>

                {(canCreateManager || canCreateEmployee) && (
                    <Button onClick={() => setCreateOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adaugă utilizator
                    </Button>
                )}
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută după nume, email sau telefon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader><CardTitle>Membri ({total})</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Se încarcă...</div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nume</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Creat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {list.map((u) => {
                                        const meta = ROLE_BADGE[u.role] || ROLE_BADGE.EMPLOYEE;
                                        const Icon = meta.icon;
                                        return (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.name}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-sm">
                                                        {u.email && (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Mail className="w-3 h-3" />
                                                                <span>{u.email}</span>
                                                            </div>
                                                        )}
                                                        {u.phone && (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Phone className="w-3 h-3" />
                                                                <span>{u.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={meta.color + ' inline-flex items-center gap-1'}>
                                                        <Icon className="w-3 h-3" />
                                                        {meta.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{formatShortDate(u.created_at)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {list.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">Nu s-au găsit utilizatori.</div>
                            )}

                            {/* Pagination */}
                            {total > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">
                                        Afișează <span className="font-medium">{startIndex}</span>–<span className="font-medium">{endIndex}</span> din <span className="font-medium">{total}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={page <= 1}>
                                            <ChevronsLeft className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {pageButtons.map((p) => (
                                            <Button
                                                key={p}
                                                variant={p === page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => goToPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        ))}

                                        <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= lastPage}>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => goToPage(lastPage)} disabled={page >= lastPage}>
                                            <ChevronsRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create user dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Adaugă utilizator</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <Label>Nume *</Label>
                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Telefon</Label>
                            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <Label>Rol *</Label>
                            <Select
                                value={form.role}
                                onValueChange={(v) => setForm((f) => ({ ...f, role: v as 'MANAGER' | 'EMPLOYEE' }))}
                                disabled={allowedRoles.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selectează rolul" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allowedRoles.includes('MANAGER') && <SelectItem value="MANAGER">Manager</SelectItem>}
                                    {allowedRoles.includes('EMPLOYEE') && <SelectItem value="EMPLOYEE">Employee</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>PIN (4+ cifre) *</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={form.pin}
                                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                                    inputMode="numeric"
                                    placeholder="ex: 1234"
                                />
                                <Button type="button" variant="outline" onClick={generatePin}>Generează</Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button className="w-full" onClick={submitCreate} disabled={creating || allowedRoles.length === 0}>
                                {creating ? 'Se creează...' : 'Creează utilizator'}
                            </Button>
                            {allowedRoles.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-2">Nu ai permisiunea de a crea utilizatori.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
