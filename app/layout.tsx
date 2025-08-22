import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from 'sonner';
import {AuthProvider} from "@/contexts/auth-context";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sky Caffe | Bistro la înălțime în Năvodari',
  description: 'Sky Caffe — bistro la înălțime, cu livrare rapidă în Năvodari. Rooftop, etaj 4 — Centrul Năvodari. Program: L–D 10:00–22:30',
  keywords: 'Sky Caffe, bistro Năvodari, livrare mâncare, rooftop restaurant, pizza, paste, burgeri',
  authors: [{ name: 'Sky Caffe Team' }],
  creator: 'Sky Caffe',
  publisher: 'Sky Caffe',
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://skycaffe.ro',
    siteName: 'Sky Caffe',
    title: 'Sky Caffe | Bistro la înălțime în Năvodari',
    description: 'Sky Caffe — bistro la înălțime, cu livrare rapidă în Năvodari',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sky Caffe | Bistro la înălțime în Năvodari',
    description: 'Sky Caffe — bistro la înălțime, cu livrare rapidă în Năvodari',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
