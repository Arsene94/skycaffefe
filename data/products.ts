import { Product } from '@/types';

export const products: Product[] = [
  // Pizza
  {
    id: '1',
    name: 'Pizza Margherita',
    description: 'Pizza clasică cu sos de roșii, mozzarella și busuioc proaspăt',
    price: 32,
    image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
    category: 'pizza',
    tags: ['vegetarian', 'clasic'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pizza-quattro-stagioni',
    name: 'Pizza Quattro Stagioni',
    description: 'Șuncă, ciuperci, măsline, anghinare și mozzarella',
    price: 45,
    image: 'https://images.pexels.com/photos/1653877/pexels-photo-1653877.jpeg',
    category: 'pizza',
    tags: ['premium'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pizza-sky-special',
    name: 'Pizza Sky Special',
    description: 'Pizza exclusivă cu salmón afumat, capere, rucola și cremă de avocado',
    price: 58,
    image: 'https://images.pexels.com/photos/4394612/pexels-photo-4394612.jpeg',
    category: 'pizza',
    tags: ['premium', 'signature'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Paste
  {
    id: 'pasta-carbonara',
    name: 'Spaghetti Carbonara',
    description: 'Paste clasice cu pancetta, ou, parmigiano și piper negru',
    price: 38,
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
    category: 'paste',
    tags: ['clasic'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pasta-bolognese',
    name: 'Penne Bolognese',
    description: 'Paste cu ragù de vită și porc, sos de roșii și parmigiano',
    price: 42,
    image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
    category: 'paste',
    tags: ['clasic'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pasta-seafood',
    name: 'Linguine ai Frutti di Mare',
    description: 'Paste cu fructe de mare, ajo, ulei de măsline și pătrunjel',
    price: 52,
    image: 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg',
    category: 'paste',
    tags: ['premium', 'seafood'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Burgeri
  {
    id: 'burger-classic',
    name: 'Sky Classic Burger',
    description: 'Carne de vită 200g, salată iceberg, roșii, ceapă, castraveti și sos special',
    price: 35,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
    category: 'burgeri',
    tags: ['clasic'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'burger-premium',
    name: 'Sky Premium Burger',
    description: 'Carne Angus 250g, bacon, brânză cheddar, rucola și sos trufe',
    price: 48,
    image: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg',
    category: 'burgeri',
    tags: ['premium'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Salate
  {
    id: 'salad-caesar',
    name: 'Caesar Salad',
    description: 'Salată romaine, piept de pui la grătar, parmezan, crutoane și dressing Caesar',
    price: 28,
    image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
    category: 'salate',
    tags: ['clasic', 'healthy'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'salad-mediterranean',
    name: 'Salată Mediteraneană',
    description: 'Mix de verdeturi, roșii cherry, măsline, brânză feta, ulei de măsline',
    price: 25,
    image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
    category: 'salate',
    tags: ['vegetarian', 'healthy'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Desert
  {
    id: 'tiramisu',
    name: 'Tiramisu',
    description: 'Desert italian clasic cu mascarpone, cafea și cacao',
    price: 22,
    image: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg',
    category: 'desert',
    tags: ['clasic', 'signature'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'chocolate-lava',
    name: 'Chocolate Lava Cake',
    description: 'Tort cald de ciocolată cu centru lichid și înghețată de vanilie',
    price: 28,
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
    category: 'desert',
    tags: ['premium', 'warm'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Bauturi
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Cafea espresso intensă din boabe proaspăt măcinate',
    price: 8,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
    category: 'bauturi',
    tags: ['coffee', 'strong'],
    recommended: false,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso cu lapte spumos și o atingere de cacao',
    price: 12,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
    category: 'bauturi',
    tags: ['coffee', 'milk'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sky-lemonade',
    name: 'Sky Lemonade',
    description: 'Limonadă fresh cu lămâie, mentă și sirop de lavandă',
    price: 18,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
    category: 'bauturi',
    tags: ['fresh', 'signature', 'cold'],
    recommended: true,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const getProductById = (id: string): Product | undefined =>
  products.find(product => product.id === id);

export const getProductsByCategory = (category: string): Product[] =>
  products.filter(product => product.category === category);

export const getRecommendedProducts = (): Product[] =>
  products.filter(product => product.recommended);

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
