import { Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'pizza',
    name: 'Pizza',
    slug: 'pizza',
    icon: 'pizza',
    description: 'Pizza artizanală cu ingrediente proaspete',
    order: 1,
  },
  {
    id: 'paste',
    name: 'Paste',
    slug: 'paste',
    icon: 'utensils',
    description: 'Paste italiene clasice și moderne',
    order: 2,
  },
  {
    id: 'burgeri',
    name: 'Burgeri',
    slug: 'burgeri',
    icon: 'chefhat',
    description: 'Burgeri gourmet cu carne premium',
    order: 3,
  },
  {
    id: 'salate',
    name: 'Salate',
    slug: 'salate',
    icon: 'leaf',
    description: 'Salate fresh cu ingrediente de sezon',
    order: 4,
  },
  {
    id: 'desert',
    name: 'Desert',
    slug: 'desert',
    icon: 'cake',
    description: 'Deserturi delicioase și dulciuri',
    order: 5,
  },
  {
    id: 'bauturi',
    name: 'Băuturi',
    slug: 'bauturi',
    icon: 'coffee',
    description: 'Cafea de specialitate și băuturi răcoritoare',
    order: 6,
  },
];

export const getCategoryById = (id: string): Category | undefined =>
  categories.find(cat => cat.id === id);

export const getCategoryBySlug = (slug: string): Category | undefined =>
  categories.find(cat => cat.slug === slug);
