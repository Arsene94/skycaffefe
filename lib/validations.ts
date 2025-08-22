import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z.string()
      .min(2, 'Numele trebuie să aibă cel puțin 2 caractere')
      .max(50, 'Numele este prea lung'),

  phone: z.string()
      .min(10, 'Numărul de telefon trebuie să aibă cel puțin 10 cifre')
      .max(15, 'Numărul de telefon este prea lung')
      .regex(/^[0-9+\-\s()]+$/, 'Format telefon invalid'),

  address: z.string()
      .min(10, 'Adresa trebuie să aibă cel puțin 10 caractere')
      .max(200, 'Adresa este prea lungă'),

  notes: z.string()
      .max(500, 'Observațiile sunt prea lungi')
      .optional(),

  paymentMethod: z.enum(['cash', 'card']).or(z.literal(undefined)).refine((val) => !!val, {
    message: 'Alegeți o metodă de plată',
  }),

  deliveryType: z.enum(['delivery', 'pickup']).or(z.literal(undefined)).refine((val) => !!val, {
    message: 'Alegeți tipul de livrare',
  }),
});

export const productFormSchema = z.object({
  name: z.string().min(1, 'Numele este obligatoriu'),
  description: z.string().min(1, 'Descrierea este obligatorie'),
  price: z.number().min(0, 'Prețul trebuie să fie pozitiv'),
  image: z.string().url('URL invalid pentru imagine'),
  category: z.string().min(1, 'Categoria este obligatorie'),
  tags: z.array(z.string()).optional(),
  recommended: z.boolean().optional(),
  available: z.boolean().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const adminLoginSchema = z.object({
  pin: z.number()
    .min(4, 'PIN-ul trebuie să aibă cel puțin 4 cifre')
    .max(8, 'PIN-ul este prea lung'),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export const productSchema = z.object({
  name: z.string()
    .min(2, 'Numele trebuie să aibă cel puțin 2 caractere')
    .max(100, 'Numele este prea lung'),

  description: z.string()
    .min(10, 'Descrierea trebuie să aibă cel puțin 10 caractere')
    .max(500, 'Descrierea este prea lungă'),

  price: z.number()
    .min(1, 'Prețul trebuie să fie pozitiv')
    .max(1000, 'Prețul este prea mare'),

  image: z.string()
    .url('URL-ul imaginii nu este valid'),

  category: z.string()
    .min(1, 'Alegeți o categorie'),

  tags: z.array(z.string())
    .optional()
    .default([]),

  recommended: z.boolean()
    .optional()
    .default(false),

  available: z.boolean()
    .optional()
    .default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;
