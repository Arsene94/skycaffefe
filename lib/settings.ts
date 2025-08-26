// lib/settings.ts
import 'server-only';
import { SETTINGS_DEFAULTS, type AppSettings } from '@/types';

const API =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://127.0.0.1:8000/api';

// mic helper ca să nu facem recursie către Next din greșeală
function isLikelyNextUrl(u: string) {
    try {
        const url = new URL(u);
        // dacă e doar /api sau aceeași origine, mare risc să lovești propriul Next
        return url.origin === 'null' || url.origin.includes('localhost:3000');
    } catch {
        return !u.startsWith('http');
    }
}

export async function fetchSettingsServer(): Promise<AppSettings> {
    if (!API || isLikelyNextUrl(API)) {
        // Protecție: nu lovi Next-ul tău
        console.warn(
            '[settings] NEXT_PUBLIC_API_URL (sau API_URL) nu e setat corect. Folosesc DEFAULTS.'
        );
        return SETTINGS_DEFAULTS;
    }

    try {
        const res = await fetch(`${API}/settings`, {
            // cache cu revalidare și tag => îl poți revalida din admin la update
            next: { revalidate: 300, tags: ['settings'] },
            // nu trimitem cookies/credentials aici — setările sunt publice
            // și evităm să transformăm fetch-ul în unul dinamic
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
