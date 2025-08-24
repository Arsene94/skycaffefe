import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://skycaffe.ro'
    const currentDate = new Date()

    // Static pages with high priority
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/meniu`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/despre`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/meniu-digital`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/checkout`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/termeni-si-conditii`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/politica-de-confidentialitate`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]

    // Dynamic pages - you can fetch from your API
    try {
        // Example: Fetch categories and products for dynamic URLs
        // const categories = await fetch(`${process.env.API_BASE_URL}/categories`).then(res => res.json())
        // const products = await fetch(`${process.env.API_BASE_URL}/products`).then(res => res.json())

        // const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
        //   url: `${baseUrl}/categorie/${category.slug}`,
        //   lastModified: new Date(category.updatedAt),
        //   changeFrequency: 'weekly' as const,
        //   priority: 0.7,
        // }))

        // const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
        //   url: `${baseUrl}/produs/${product.slug}`,
        //   lastModified: new Date(product.updatedAt),
        //   changeFrequency: 'weekly' as const,
        //   priority: 0.6,
        // }))

        return [
            ...staticPages,
            // ...categoryPages,
            // ...productPages
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return staticPages
    }
}
