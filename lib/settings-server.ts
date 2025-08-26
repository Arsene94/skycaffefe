// lib/settings-server.ts
// import 'server-only';   // ⛔ scoate asta
import { SETTINGS_DEFAULTS, type AppSettings } from '@/types';

const API =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://127.0.0.1:8000/api';

function isLikelyNextUrl(u: string) {
    try {
        const url = new URL(u);
        return /localhost:3000|127\.0\.0\.1:3000/i.test(url.host);
    } catch {
        return !u.startsWith('http');
    }
}

export async function fetchSettingsServer(): Promise<AppSettings> {
    // Protecție: dacă e apelat din client, aruncă eroare la runtime
    if (typeof window !== 'undefined') {
        throw new Error('fetchSettingsServer() trebuie rulat doar pe server (app/).');
    }

    if (!API || isLikelyNextUrl(API)) {
        console.warn('[settings] NEXT_PUBLIC_API_URL/API_URL nu e setat corect. Folosesc DEFAULTS.');
        return SETTINGS_DEFAULTS;
    }

    try {
        const res = await fetch(`${API}/settings`, {
            next: { revalidate: 300, tags: ['settings'] },
            cache: 'force-cache',
        });
        if (!res.ok) {
            console.error('[settings] Eroare la fetch:', res.status, res.statusText);
            return SETTINGS_DEFAULTS;
        }
        const json = await res.json().catch(() => ({}));
        const data = json?.data ?? json ?? {};
        return { ...SETTINGS_DEFAULTS, ...data } as AppSettings;
    } catch (e) {
        console.error('[settings] Fetch failed:', e);
        return SETTINGS_DEFAULTS;
    }
}
