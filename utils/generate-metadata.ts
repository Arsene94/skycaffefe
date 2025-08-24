import { Metadata } from 'next'
import { seoConfig } from '@/lib/seo-config'

interface PageMetadataProps {
    title?: string
    description?: string
    keywords?: string[]
    path?: string
    image?: string
    noindex?: boolean
}

export function generatePageMetadata({
                                         title,
                                         description,
                                         keywords = [],
                                         path = '',
                                         image = '/og-image.jpg',
                                         noindex = false
                                     }: PageMetadataProps = {}): Metadata {
    const fullTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle
    const fullDescription = description || seoConfig.defaultDescription
    const fullKeywords = [...seoConfig.defaultKeywords, ...keywords]
    const fullUrl = `${seoConfig.siteUrl}${path}`
    const fullImage = image.startsWith('http') ? image : `${seoConfig.siteUrl}${image}`

    return {
        metadataBase: new URL(fullUrl),
        applicationName: fullTitle,
        title: {
            default: fullTitle,
            template: '%s | Sky Caffe'
        },
        description: fullDescription,
        keywords: fullKeywords,
        authors: [{ name: 'Ion Arsene Claudiu', url: seoConfig.siteUrl }],
        creator: 'Ion Arsene Claudiu',
        publisher: seoConfig.siteName,
        robots: noindex ? 'noindex,nofollow' : 'index,follow',

        openGraph: {
            type: 'website',
            locale: 'ro_RO',
            url: fullUrl,
            siteName: seoConfig.siteName,
            title: fullTitle,
            description: fullDescription,
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: title || seoConfig.defaultTitle,
                    type: 'image/jpeg',
                }
            ],
        },

        twitter: {
            card: 'summary_large_image',
            site: '@skycaffe_ro',
            creator: '@skycaffe_ro',
            title: fullTitle,
            description: fullDescription,
            images: [fullImage],
        },

        alternates: {
            canonical: fullUrl,
            languages: {
                'ro-RO': fullUrl,
                'x-default': fullUrl,
            },
        },
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        category: 'Food & Beverage',
        classification: 'Restaurant',

        // App-specific metadata
        appleWebApp: {
            capable: true,
            title: fullTitle,
            statusBarStyle: 'default',
        },

        // Verification for search engines
        verification: {
            google: 'your-google-verification-code',
            yandex: 'your-yandex-verification-code',
        },

        // Additional metadata
        other: {
            'msapplication-TileColor': 'hsl(150 80% 38%)',
            'application-name': fullTitle,
            'apple-mobile-web-app-title': fullTitle,
            'format-detection': 'telephone=no',
        },
    }
}
