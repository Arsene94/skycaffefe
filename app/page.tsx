export const dynamic = 'force-static'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/header.server'
import { Footer } from '@/components/layout/footer' // server-only
import HomeClient from './home-client'
import heroImage from '@/public/hero.webp'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Phone } from 'lucide-react'

export default function HomePage() {
  return (
      <>
        <Header />
        <main role="main">
          {/* HERO - SSR only */}
          <section className="relative z-10 h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center justify-center text-white">
            <Image
                src={heroImage}
                alt="Sky Caffe rooftop terrace cu vederea orașului Năvodari, mese elegante și atmosferă premium pentru o experiență culinară de neuitat"
                priority
                fetchPriority="high"
                sizes="100vw"
                quality={55}
                placeholder="empty"
                className="object-cover"
                fill
            />
            <div
                className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(16,185,129,.65)_0%,_rgba(5,150,105,.65)_100%)]"
                aria-hidden
            />

            <div className="relative z-10 text-center text-white px-4 max-w-4xl">
              {/* inlocuiește <Badge> */}
              <span className="inline-flex items-center rounded-md border border-white/30 bg-white/20 px-2 py-1 text-xs font-medium mb-4">
      Rooftop Experience
    </span>

              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Bistro la înălțime<br />
                cu <span className="bg-gradient-to-r from-[hsl(var(--accent))] to-yellow-300 bg-clip-text text-transparent">livrare rapidă</span>
              </h1>

              <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
                Experiență culinară premium în centrul Năvodariului. Savurează mâncarea delicioasă cu o priveliște spectaculoasă.
              </p>

              {/* inlocuiește <Button> cu ancore simple (fără hidratare) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Link
                    href="/meniu"
                    prefetch={false}
                    className="inline-flex items-center justify-center rounded-md bg-white px-8 py-4 text-lg font-medium text-[hsl(var(--primary))] hover:bg-white/90"
                >
                  Explorează meniul
                </Link>
                <Link
                    href="/despre"
                    prefetch={false}
                    className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/10 px-8 py-4 text-lg text-white hover:bg-white/20"
                >
                  Despre noi
                </Link>
              </div>
            </div>

            {/* cardurile info rămân la fel; sunt doar div-uri simple */}
            <aside className="absolute bottom-8 left-4 right-4 z-10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-4xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-md p-4 flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Program</p>
                    <p className="text-gray-600"><time dateTime="10:00">10:00</time>–<time dateTime="22:30">22:30</time> zilnic</p>
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-md p-4 flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Locație</p>
                    <address className="text-gray-600 not-italic">Rooftop, etaj 4, Centrul Năvodari</address>
                  </div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-md p-4 flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[hsl(var(--primary))]" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Comenzi</p>
                    <a href="tel:+40751123456" className="text-gray-600 hover:text-[hsl(var(--primary))]">0751 123 456</a>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          {/* Sub-fold: montează doar după mount pentru a nu afecta LCP */}
          <HomeClient />
        </main>
        <Footer />
      </>
  )
}
