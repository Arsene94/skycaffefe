import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/providers/theme-provider';
import ToasterMount from '@/components/util/ToasterMount'
import { AuthProvider } from "@/contexts/auth-context";
import Script from "next/script";
import { generatePageMetadata } from "@/utils/generate-metadata";
import { SettingsProvider } from '@/contexts/settings-context';
import { fetchSettingsServer } from '@/lib/settings';

// Enhanced viewport configuration
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'hsl(150 80% 38%)' },
        { media: '(prefers-color-scheme: dark)', color: 'hsl(150 85% 48%)' },
    ],
};

// Comprehensive SEO metadata
export const metadata: Metadata = generatePageMetadata({
    title: 'Sky Caffe | Bistro la înălțime în Năvodari - Livrare Rapidă',
    description:
        'Sky Caffe - bistro premium pe rooftop în centrul Năvodariului. Livrare rapidă pizza, paste, burgeri și deserturi. Program L-D 10:00-22:30. Comandă online!',
    keywords: [
        'Sky Caffe', 'bistro Năvodari', 'restaurant Năvodari', 'livrare mâncare',
        'rooftop restaurant', 'pizza Năvodari', 'paste Năvodari', 'burgeri Năvodari',
        'mâncare online', 'livrare rapidă', 'terasă restaurant', 'centrul Năvodari',
        'meniu online', 'comandă mâncare', 'bistro rooftop', 'restaurant terasa',
        'Sky Caffe Năvodari', 'etaj 4 Năvodari', 'mâncare de calitate'
    ],
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const settings = await fetchSettingsServer();

    return (
        <html lang="ro" suppressHydrationWarning>
        <head>
            {/* Preconnect to external domains for performance */}
            <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
            {/* DNS prefetch for external resources */}
            {/*<link rel="dns-prefetch" href="https://www.google-analytics.com" />*/}
            {/* Favicon and icons */}
            <link rel="icon" href="/favicon.ico" sizes="32x32" />
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/manifest.json" />
            {/* Preload hero */}
        </head>

        {/* overflow-x-hidden previne scroll-ul orizontal pe mobil fără a afecta desktopul */}
        <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <SettingsProvider initial={settings}>
                    {/* Skip to main content pentru accesibilitate */}
                    <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Sari la conținutul principal
                    </a>

                    {/* Conținutul site-ului */}
                    <main id="main-content">{children}</main>

                    {/* Structured data for local business */}
                    <Script
                        id="structured-data"
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "Restaurant",
                                "name": "Sky Caffe",
                                "alternateName": "Sky Caffe Năvodari",
                                "description": "Bistro premium pe rooftop cu livrare rapidă în Năvodari",
                                "image": [
                                    "https://skycaffe.ro/hero.webp",
                                    "https://skycaffe.ro/og-image.webp"
                                ],
                                "address": {
                                    "@type": "PostalAddress",
                                    "streetAddress": "Centrul Năvodari, Rooftop etaj 4",
                                    "addressLocality": "Năvodari",
                                    "addressCountry": "RO"
                                },
                                "geo": { "@type": "GeoCoordinates", "latitude": "44.3167", "longitude": "28.6167" },
                                "url": "https://skycaffe.ro",
                                "telephone": "+40751123456",
                                "servesCuisine": ["Romanian", "Italian", "International"],
                                "priceRange": "$$",
                                "openingHours": "Mo-Su 10:00-22:30",
                                "hasMenu": "https://skycaffe.ro/meniu",
                                "acceptsReservations": true,
                                "deliveryService": { "@type": "DeliveryService", "serviceArea": { "@type": "City", "name": "Năvodari" } },
                                "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" },
                                "review": [
                                    {
                                        "@type": "Review",
                                        "reviewRating": { "@type": "Rating", "ratingValue": "5" },
                                        "author": { "@type": "Person", "name": "Maria Popescu" },
                                        "reviewBody": "Mâncarea este delicioasă și vederea de pe rooftop este spectaculoasă! Livrarea a fost foarte rapidă."
                                    }
                                ]
                            })
                        }}
                    />

                    <ToasterMount />
                </SettingsProvider>
            </ThemeProvider>
        </AuthProvider>

        {/* Google Analytics - replace with your tracking ID */}
        {/*<Script src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID" strategy="afterInteractive" />*/}
        {/*<Script*/}
        {/*    id="google-analytics"*/}
        {/*    strategy="afterInteractive"*/}
        {/*    dangerouslySetInnerHTML={{*/}
        {/*        __html: `*/}
        {/*      window.dataLayer = window.dataLayer || [];*/}
        {/*      function gtag(){dataLayer.push(arguments);}*/}
        {/*      gtag('js', new Date());*/}
        {/*      gtag('config', 'GA_TRACKING_ID', { page_title: document.title, page_location: window.location.href });*/}
        {/*    `,*/}
        {/*    }}*/}
        {/*/>*/}
        </body>
        </html>
    );
}
