import { Offer } from '@/types';

export const offers: Offer[] = [
  {
    id: 'pizza-discount',
    name: '15% Reducere Pizza',
    description: 'Reducere 15% la toate pizza-urile',
    type: 'PERCENT',
    value: 15,
    applicationType: 'category',
    categoryId: 'temporibus-qui',
    conditions: {
      minItems: 1,
      minSubtotal: 30,
    },
    stackable: false,
    priority: 1,
    active: true,
  },
  {
    id: 'free-delivery',
    name: 'Livrare Gratuită',
    description: 'Livrare gratuită pentru comenzi peste 50 lei',
    type: 'FIXED',
    value: 10, // delivery cost
    applicationType: 'cart',
    conditions: {
      minSubtotal: 50,
    },
    stackable: true,
    priority: 2,
    active: true,
  },
  {
    id: 'combo-deal',
    name: 'Combo Pasta + Băutură',
    description: '10 lei reducere la combinația pastă + băutură',
    type: 'FIXED',
    value: 10,
    applicationType: 'productIds',
    productIds: ['pasta-carbonara', 'pasta-bolognese', 'cappuccino', 'sky-lemonade'],
    conditions: {
      minItems: 2,
    },
    stackable: true,
    priority: 3,
    active: true,
  },
];

export const getActiveOffers = (): Offer[] =>
  offers.filter(offer => offer.active).sort((a, b) => a.priority - b.priority);

export const calculateDiscount = (cartItems: any[], offers: Offer[]): number => {
  let totalDiscount = 0;
  const activeOffers = getActiveOffers();

  for (const offer of activeOffers) {
    const discount = calculateOfferDiscount(cartItems, offer);
    if (offer.stackable) {
      totalDiscount += discount;
    } else if (discount > totalDiscount) {
      totalDiscount = discount;
    }
  }

  return totalDiscount;
};

function calculateOfferDiscount(cartItems: any[], offer: Offer): number {
  // TODO: Implement complex discount calculation logic
  // This is a simplified version for demo purposes
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (offer.conditions.minSubtotal && subtotal < offer.conditions.minSubtotal) {
    return 0;
  }

  if (offer.conditions.minItems && cartItems.length < offer.conditions.minItems) {
    return 0;
  }

  switch (offer.applicationType) {
    case 'cart':
      return offer.type === 'PERCENT'
        ? (subtotal * offer.value) / 100
        : offer.value;

    case 'category':
      const categoryTotal = cartItems
        .filter(item => item.product.category === offer.categoryId)
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      return offer.type === 'PERCENT'
        ? (categoryTotal * offer.value) / 100
        : offer.value;

    default:
      return 0;
  }
}
