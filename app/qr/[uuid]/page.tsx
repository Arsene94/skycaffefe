// app/qr/[uuid]/page.tsx
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // evită caching la nivel de route

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

type QrResponse = {
    uuid: string;
    type: 'redirect' | 'info';
    url?: string | null;
    data?: Record<string, any> | null;
};

async function getQr(uuid: string): Promise<QrResponse | null> {
    const res = await fetch(`${API_BASE_URL}/qr/${encodeURIComponent(uuid)}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
        // poți pune aici un logging dacă vrei
        throw new Error(`Failed to fetch QR: ${res.status}`);
    }
    return res.json();
}

export default async function QrPage({
                                         params,
                                     }: {
    params: Promise<{ uuid: string }>;
}) {
    // NOTE: în setup-ul tău, params e Promise -> îl așteptăm
    const { uuid } = await params;

    const data = await getQr(uuid);
    if (!data) {
        notFound();
    }

    // tip redirect => redirect imediat
    if (data.type === 'redirect' && data.url) {
        redirect(data.url);
    }

    const info = data.data || {};

    return (
        <main className="container mx-auto px-4 py-10">
            <div className="mx-auto max-w-2xl rounded-lg border p-6">
                <h1 className="text-2xl font-bold mb-1">Informații QR</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    UUID: <span className="font-mono">{data.uuid}</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {info.name && (
                        <div>
                            <div className="text-xs text-muted-foreground">Nume</div>
                            <div className="font-semibold">{info.name}</div>
                        </div>
                    )}
                    {info.phone && (
                        <div>
                            <div className="text-xs text-muted-foreground">Telefon</div>
                            <div className="font-semibold">{info.phone}</div>
                        </div>
                    )}
                    {info.email && (
                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="font-semibold">{info.email}</div>
                        </div>
                    )}
                    {info.website && (
                        <div>
                            <div className="text-xs text-muted-foreground">Website</div>
                            <div className="font-semibold">
                                <a
                                    href={info.website}
                                    className="text-primary underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {info.website}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {info.description && (
                    <div className="mt-6">
                        <div className="text-xs text-muted-foreground">Descriere</div>
                        <div>{info.description}</div>
                    </div>
                )}
            </div>
        </main>
    );
}
