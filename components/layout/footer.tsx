'use client';

import Link from 'next/link';
import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  Mail,
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
      <footer className="bg-card border-t border-border" role="contentinfo">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link
                  href="/"
                  className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                  aria-label="Sky Caffe - Acasă"
              >
                Sky Caffe
              </Link>
              <p className="mt-2 text-muted-foreground max-w-md">
                Sky Caffe — bistro la înălțime, cu livrare rapidă în Năvodari.
                Experiență culinară premium pe rooftop-ul din centrul orașului.
              </p>

              {/* Social Media Links */}
              <div
                  className="flex space-x-4 mt-4"
                  role="list"
                  aria-label="Rețele sociale"
              >
                <Link
                    href="https://instagram.com/skycaffe"
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-1"
                    aria-label="Urmărește-ne pe Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link
                    href="https://facebook.com/skycaffe"
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-1"
                    aria-label="Urmărește-ne pe Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                  <Facebook className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <address
                  className="not-italic"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
              >
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                    <span itemProp="streetAddress">Rooftop, etaj 4</span>
                    <br />
                    <span>Centrul Năvodari</span>
                    <br />
                    <span itemProp="addressLocality">Năvodari</span>,{' '}
                      <span itemProp="addressCountry">România</span>
                  </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <a
                        href="tel:+40751123456"
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                        aria-label="Sună la Sky Caffe"
                    >
                      +40 751 123 456
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <a
                        href="mailto:contact@skycaffe.ro"
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                        aria-label="Trimite email la Sky Caffe"
                    >
                      contact@skycaffe.ro
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>
                    Luni–Duminică:{' '}
                    <time dateTime="2025-08-24T10:00:00+03:00">10:00</time>–
                    <time dateTime="2025-08-24T22:30:00+03:00">22:30</time>
                  </span>
                  </div>
                </div>
              </address>
            </div>

            {/* Quick Navigation */}
            <nav aria-label="Navigare footer">
              <h3 className="font-semibold text-foreground mb-4">Navigare</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '/meniu', label: 'Meniul nostru', desc: 'Accesează meniul complet cu preparate și prețuri' },
                  { href: '/despre', label: 'Despre noi', desc: 'Află mai multe despre Sky Caffe și echipa noastră' },
                  { href: '/checkout', label: 'Comandă online', desc: 'Plasează o comandă online pentru livrare sau ridicare' },
                  { href: '/contact', label: 'Contact', desc: 'Informații de contact și locație' },
                  { href: '/termeni-si-conditii', label: 'Termeni și condiții', desc: 'Consultă termenii și condițiile de utilizare' },
                  { href: '/politica-de-confidentialitate', label: 'Politica de confidențialitate', desc: 'Consultă politica de confidențialitate' },
                ].map(({ href, label, desc }, idx) => (
                    <li key={idx}>
                      <Link
                          href={href}
                          className="block text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm py-1"
                          aria-describedby={`footer-desc-${idx}`}
                      >
                        {label}
                      </Link>
                      <span id={`footer-desc-${idx}`} className="sr-only">
                    {desc}
                  </span>
                    </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Copyright */}
          <div className="border-t border-border mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
              <div className="text-center md:text-left">
                <p>&copy; {currentYear} Sky Caffe. Toate drepturile rezervate.</p>
                <p className="mt-1">Bistro la înălțime în Năvodari</p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end gap-4 text-xs">
                <Link
                    href="/gdpr"
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                >
                  GDPR
                </Link>
                <Link
                    href="/cookies"
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                >
                  Cookie-uri
                </Link>
                <Link
                    href="/sitemap.xml"
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                    target="_blank"
                    rel="noopener"
                >
                  Sitemap
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Sky Caffe',
                alternateName: 'Sky Caffe Năvodari',
                url: 'https://skycaffe.ro',
                logo: 'https://skycaffe.ro/logo.png',
                image: 'https://skycaffe.ro/hero.jpeg',
                description: 'Bistro premium pe rooftop cu livrare rapidă în Năvodari',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Centrul Năvodari, Rooftop etaj 4',
                  addressLocality: 'Năvodari',
                  addressCountry: 'RO',
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+40751123456',
                  contactType: 'customer service',
                  availableLanguage: ['Romanian'],
                },
                sameAs: [
                  'https://facebook.com/skycaffe',
                  'https://instagram.com/skycaffe',
                ],
              }),
            }}
        />
      </footer>
  );
}
