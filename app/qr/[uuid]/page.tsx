import { notFound, redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!; // ex: https://api.domeniu.ro/api

async function getQr(uuid: string) {
    const res = await fetch(`${API_BASE_URL}/qr/${encodeURIComponent(uuid)}`, {
        cache: 'no-store',
        // dacă ai nevoie de cookies pentru rate limit sau auth admin-only, adaugă aici headers/credentials
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch QR');
    return res.json();
}

export default async function QrPage({ params }: { params: { uuid: string } }) {
    const data = await getQr(params.uuid);
    if (!data) notFound();

    // type redirect => redirect imediat
    if (data.type === 'redirect' && data.url) {
        redirect(data.url);
    }

    // altfel afișăm info simplu (poți personaliza frumos aici)
    const info = data.data || {};
    return (
        <main className="container mx-auto px-4 py-10">
            <div className="mx-auto max-w-2xl rounded-lg border p-6">
                <h1 className="text-2xl font-bold mb-1">Informații QR</h1>
                <p className="text-sm text-muted-foreground mb-6">UUID: <span className="font-mono">{data.uuid}</span></p>
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
                                <a href={info.website} className="text-primary underline" target="_blank" rel="noreferrer">
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
