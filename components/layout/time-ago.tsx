// components/TimeAgo.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

type TimeAgoProps = {
    timestamp: string;
};

export function TimeAgo({ timestamp }: TimeAgoProps) {
    const [value, setValue] = useState('');

    useEffect(() => {
        const parsed = new Date(timestamp);
        const relative = formatDistanceToNow(parsed, {
            addSuffix: true,
            locale: ro,
        });
        setValue(relative);
    }, [timestamp]);

    return <time dateTime={timestamp}>{value}</time>;
}
