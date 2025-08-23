import type { Offer, CartItem, OfferHint } from '@/types';

export function getOfferHints(offers: Offer[], items: CartItem[]): OfferHint[] {
    const hints: { code: string; message: string }[] = [];

    if (!offers?.length || !items?.length) return hints;

    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    for (const offer of offers) {
        const minSubtotal = offer.conditions?.minSubtotal ?? 0;
        const minItems = offer.conditions?.minItems ?? 0;

        if (minSubtotal && subtotal < minSubtotal) {
            hints.push({
                code: offer.code || '',
                message: `Adaugă produse de încă ${(minSubtotal - subtotal).toFixed(2)} lei pentru a activa oferta „${offer.name}”.`
            });
        }

        if (minItems && totalItems < minItems) {
            hints.push({
                code: offer.code + '_items',
                message: `Adaugă încă ${minItems - totalItems} produse pentru a activa oferta „${offer.name}”.`
            });
        }
    }

    return hints;
}
