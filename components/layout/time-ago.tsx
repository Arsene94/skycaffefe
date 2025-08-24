'use client';
import { useEffect, useState } from 'react';

export default function RelativeTime({ weeksAgo, label }: { weeksAgo: number; label: string }) {
    const [dateTime, setDateTime] = useState('');

    useEffect(() => {
        const now = new Date();
        const past = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
        setDateTime(past.toISOString());
    }, [weeksAgo]);

    return (
        <time dateTime={dateTime}>{label}</time>
    );
}
