'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import CheckoutSuccessContent from './checkout-success-content';

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
