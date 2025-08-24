import { seoConfig } from '@/lib/seo-config'

export function LocalBusinessStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": seoConfig.siteName,
        "alternateName": "Sky Caffe Năvodari",
        "description": seoConfig.defaultDescription,
        "image": [
            `${seoConfig.siteUrl}/hero.webp`,
            `${seoConfig.siteUrl}/og-image.webp`
        ],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": seoConfig.contact.address.street,
            "addressLocality": seoConfig.contact.address.city,
            "addressRegion": seoConfig.contact.address.region,
            "postalCode": seoConfig.contact.address.postal,
            "addressCountry": seoConfig.contact.address.country
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": seoConfig.contact.coordinates.lat,
            "longitude": seoConfig.contact.coordinates.lng
        },
        "url": seoConfig.siteUrl,
        "telephone": seoConfig.contact.phone,
        "email": seoConfig.contact.email,
        "servesCuisine": ["Romanian", "Italian", "International"],
        "priceRange": "$$",
        "openingHours": `${seoConfig.businessHours.dayOfWeek.map(day => day.substring(0, 2)).join('-')} ${seoConfig.businessHours.opens}-${seoConfig.businessHours.closes}`,
        "hasMenu": `${seoConfig.siteUrl}/meniu`,
        "acceptsReservations": true,
        "deliveryService": {
            "@type": "DeliveryService",
            "serviceArea": {
                "@type": "City",
                "name": seoConfig.contact.address.city
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
        },
        "sameAs": [
            seoConfig.social.facebook,
            seoConfig.social.instagram
        ]
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}

export function WebsiteStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": seoConfig.siteName,
        "alternateName": "Sky Caffe Năvodari",
        "url": seoConfig.siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${seoConfig.siteUrl}/meniu?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}
