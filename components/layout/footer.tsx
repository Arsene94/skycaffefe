'use client';

import Link from 'next/link';
import { MapPin, Phone, Clock, Instagram, Facebook, Mail } from 'lucide-react';
import {useSettings} from "@/contexts/settings-context";
import { useMemo } from 'react';
import WorkingHours from "@/components/layout/WorkingHours";

function looksLikeStreet(s: string) {
  const hints = [
    'str', 'str.', 'strada', 'bld', 'bd', 'bulevard', 'calea',
    'aleea', 'alee', 'șoseaua', 'soseaua', 'sos.', 'piata', 'piața',
    'nr', 'no', 'num', 'bl', 'sc', 'et', 'etaj', 'ap'
  ];
  const hasHint = hints.some(h => new RegExp(`\\b${h}\\b`, 'i').test(s));
  const hasNumber = /\d/.test(s);
  return hasHint || (hasNumber && /(nr|bl|sc|et|ap)/i.test(s));
}

function normalizeAddressLines(address?: string): (string | null)[] {
  const raw = (address ?? '').trim();
  if (!raw) return [];

  // tăiem după virgulă sau newline
  const parts = raw.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [raw];

  // țara (România/RO), o scoatem dacă există
  const countryIdx = parts.findIndex(p => /\brom[aâ]nia\b|\bRO\b/i.test(p));
  const country = countryIdx >= 0 ? parts.splice(countryIdx, 1)[0] : null;

  // identificăm „strada” (pot fi mai multe fragmente)
  const streetIdxs: number[] = [];
  parts.forEach((p, i) => { if (looksLikeStreet(p)) streetIdxs.push(i); });

  const streetParts = streetIdxs.map(i => parts[i]);
  streetIdxs.sort((a, b) => b - a).forEach(i => parts.splice(i, 1)); // scoatem din rest

  const street = streetParts.join(', ').trim();
  const cityRegion = parts.join(', ').trim(); // ce rămâne: oraș/județ/sector etc.

  const lines = [street, cityRegion, country].filter(Boolean);
  return lines.length ? lines : [raw];
}

// ---- în componentă:
function AddressBlock({ address }: { address: string }) {
  const pretty = useMemo(
      () => normalizeAddressLines(address).join('\n'),
      [address]
  );

  return (
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span className="whitespace-pre-line break-words">{pretty}</span>
      </div>
  );
}

export function Footer() {
  const { business_name, business_short, site_email, support_phone, pickup_address, availability, availability_label_with_hours } = useSettings();
  const currentYear = new Date().getFullYear();
  console.log(availability)
console.log(availability_label_with_hours)
  return (
      <footer className="w-full bg-card border-t border-border" role="contentinfo">
        {/* overflow-x-hidden împiedică scroll-ul orizontal pe ecrane mici */}
        <div className="container mx-auto px-4 py-10 sm:py-12 overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 min-w-0">
            {/* Brand Section */}
            <div className="lg:col-span-2 min-w-0">
              <Link
                  href="/"
                  className="block text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm max-w-full truncate sm:truncate-0"
                  aria-label="Sky Caffe - Acasă"
              >
                {business_name}
              </Link>

              <p className="mt-2 text-muted-foreground max-w-prose break-words">
                {business_name} {business_short && (`— ${business_short}`)}
                Experiență culinară premium pe rooftop-ul din centrul orașului.
              </p>

              {/* Social Media Links */}
              <div
                  className="mt-4 flex flex-wrap items-center gap-3"
                  role="list"
                  aria-label="Rețele sociale"
              >
                <div role="listitem">
                  <Link
                      href="https://instagram.com/skycaffe"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-2"
                      aria-label="Urmărește-ne pe Instagram"
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                </div>
                <div role="listitem">
                  <Link
                      href="https://facebook.com/skycaffe"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-2"
                      aria-label="Urmărește-ne pe Facebook"
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <address className="not-italic" itemScope itemType="https://schema.org/PostalAddress">
                <div className="space-y-3 text-sm text-muted-foreground break-words">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                    <AddressBlock address={pickup_address ?? ''} />
                  </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <a
                        href={`tel:${support_phone}`}
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                        aria-label={`Sună la ${business_name}`}
                    >
                      {support_phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {/* break-all pe email ca să nu împingă layout-ul pe ecrane înguste */}
                    <a
                        href={`mailto:${site_email}`}
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm break-all sm:break-words"
                        aria-label="Trimite email la Sky Caffe"
                    >
                      {site_email}
                    </a>
                  </div>

                  <WorkingHours
                      label={availability_label_with_hours}
                      className="space-y-1"
                  />
                </div>
              </address>
            </div>

            {/* Quick Navigation */}
            <nav className="min-w-0" aria-label="Navigare footer">
              <h3 className="font-semibold text-foreground mb-4">Navigare</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '/meniu', label: 'Meniul nostru delivery', desc: 'Accesează meniul complet cu preparate și prețuri' },
                  { href: '/meniu', label: 'Meniul nostru digital', desc: 'Accesează meniul complet cu preparate și prețuri' },
                  { href: '/despre', label: 'Despre noi', desc: 'Află mai multe despre Sky Caffe și echipa noastră' },
                  { href: '/checkout', label: 'Comandă online', desc: 'Plasează o comandă online pentru livrare sau ridicare' },
                  { href: '/contact', label: 'Contact', desc: 'Informații de contact și locație' },
                  { href: '/termeni-si-conditii', label: 'Termeni și condiții', desc: 'Consultă termenii și condițiile de utilizare' },
                  { href: '/politica-de-confidentialitate', label: 'Politica de confidențialitate', desc: 'Consultă politica de confidențialitate' },
                ].map(({ href, label, desc }, idx) => (
                    <li key={idx} className="min-w-0">
                      <Link
                          href={href}
                          className="block max-w-full break-words text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm py-1"
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
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4 min-w-0">
              <div className="text-center md:text-left min-w-0">
                <p className="truncate md:whitespace-normal">
                  &copy; {currentYear} {business_name}. Toate drepturile rezervate.
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end gap-3 sm:gap-4 text-xs">
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

        {/* Structured Data (nu afectează layout-ul) */}
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: site_email,
                alternateName: site_email,
                url: 'https://skycaffe.ro',
                logo: 'https://skycaffe.ro/logo.png',
                image: 'https://skycaffe.ro/hero.webp',
                description: {business_short},
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
