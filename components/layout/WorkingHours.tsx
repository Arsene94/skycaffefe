'use client';

import { Clock } from 'lucide-react';

type Props = {
    /** ex: "Luni–Marți 09:00–18:00; Joi–Vineri 10:00–20:00" sau "Închis complet" */
    label?: string | null;
    className?: string;
};

/**
 * Afișează fiecare segment din availability_label_with_hours pe linii separate:
 * Luni–Duminică: <time>10:00</time>–<time>22:30</time>
 */
export function WorkingHours({ label, className }: Props) {
    if (!label || !label.trim()) return null;

    // “Închis complet”
    const lower = label.toLowerCase();
    if (lower.includes('închis')) {
        return (
            <div className={className}>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Închis</span>
                </div>
            </div>
        );
    }

    // Împărțim segmentele după “;”
    const segments = label.split(/\s*;\s*/).filter(Boolean);

    // regex: <zile> <start>–<end>
    // ex: "Luni–Marți 09:00–18:00" sau "Duminică 10:00–22:30"
    const SEG_RE = /^(.*?)\s+(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})$/u;

    return (
        <div className={className}>
            {segments.map((seg, i) => {
                const m = seg.match(SEG_RE);
                if (!m) {
                    // fallback: afișăm ca atare dacă nu se pot extrage orele
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{seg}</span>
                        </div>
                    );
                }
                const [, dayPart, start, end] = m;
                return (
                    <div key={i} className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
              {dayPart.trim()}:{' '}
                            <time dateTime={start}>{start}</time>–<time dateTime={end}>{end}</time>
            </span>
                    </div>
                );
            })}
        </div>
    );
}

export default WorkingHours;
