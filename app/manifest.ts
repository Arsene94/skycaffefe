import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Sky Caffe - Bistro la înălțime în Năvodari',
        short_name: 'Sky Caffe',
        description: 'Bistro premium pe rooftop cu livrare rapidă în Năvodari. Pizza, paste, burgeri și deserturi de calitate.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fefce8',
        theme_color: '#16a34a',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'ro',
        categories: ['food', 'business', 'lifestyle'],
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/favicon-32x32.png',
                sizes: '32x32',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/favicon-16x16.png',
                sizes: '16x16',
                type: 'image/png',
                purpose: 'any'
            }
        ],
        shortcuts: [
            {
                name: 'Meniu',
                short_name: 'Meniu',
                description: 'Vezi meniul complet cu preparate și prețuri',
                url: '/meniu',
                icons: [
                    {
                        src: '/android-chrome-192x192.png',
                        sizes: '192x192'
                    }
                ]
            },
            {
                name: 'Comandă',
                short_name: 'Comandă',
                description: 'Plasează o comandă rapidă',
                url: '/checkout',
                icons: [
                    {
                        src: '/android-chrome-192x192.png',
                        sizes: '192x192'
                    }
                ]
            }
        ],
        screenshots: [
            {
                src: '/screenshot-wide.jpg',
                sizes: '1280x720',
                type: 'image/jpeg',
                form_factor: 'wide',
                label: 'Sky Caffe homepage pe desktop'
            },
            {
                src: '/screenshot-narrow.jpg',
                sizes: '640x1136',
                type: 'image/jpeg',
                form_factor: 'narrow',
                label: 'Sky Caffe homepage pe mobil'
            }
        ]
    }
}
