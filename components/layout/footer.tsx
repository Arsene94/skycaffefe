"use client";
import Link from 'next/link'
import { MapPin, Phone, Clock, Instagram, Facebook, Mail } from 'lucide-react'
import apiClient from "@/lib/api";
import {useEffect, useState} from "react";
import {AppSettings, SETTINGS_DEFAULTS} from "@/types";

// ——— util: split adresă stabil (fără hooks)
function looksLikeStreet(s: string) {
  const hints = ['str','str.','strada','bld','bd','bulevard','calea','aleea','alee','șoseaua','soseaua','sos.','piata','piața','nr','no','num','bl','sc','et','etaj','ap']
  const hasHint = hints.some(h => new RegExp(`\\b${h}\\b`, 'i').test(s))
  const hasNumber = /\d/.test(s)
  return hasHint || (hasNumber && /(nr|bl|sc|et|ap)/i.test(s))
}
function normalizeAddressLines(address?: string): string[] {
  const raw = (address ?? '').trim()
  if (!raw) return []
  const parts = raw.split(/[,\n]/).map(p => p.trim()).filter(Boolean)
  if (parts.length <= 1) return [raw]

  const countryIdx = parts.findIndex(p => /\brom[aâ]nia\b|\bRO\b/i.test(p))
  const country = countryIdx >= 0 ? parts.splice(countryIdx, 1)[0] : null

  const streetIdxs: number[] = []
  parts.forEach((p, i) => { if (looksLikeStreet(p)) streetIdxs.push(i) })
  const streetParts = streetIdxs.map(i => parts[i])
  streetIdxs.sort((a, b) => b - a).forEach(i => parts.splice(i, 1))
  const street = streetParts.join(', ').trim()
  const cityRegion = parts.join(', ').trim()

  const lines = [street, cityRegion, country].filter(Boolean) as string[]
  return lines.length ? lines : [raw]
}

export function Footer() {
    const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
    const [isFetched, setIsFetched] = useState(0);
    useEffect(() => {
        const getSettings = async () => {
            const response = await apiClient.getSettings();
            setSettings(response.data);
            setIsFetched(1);
        }
        if (isFetched === 0) {
            getSettings();
        }
    }, [isFetched]);
    const {
    business_name,
    business_short,
    site_email,
    support_phone,
    address,
    availability_label_with_hours,
  } = settings || {}
  const currentYear = new Date().getFullYear()
  const addressPretty = normalizeAddressLines(address || '').join('\n')

  return (
      <footer className="w-full bg-card border-t border-border" role="contentinfo">
        <div className="container mx-auto px-4 py-10 sm:py-12 overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 min-w-0">
            {/* Brand */}
            <div className="lg:col-span-2 min-w-0">
              <Link
                  href="/"
                  className="block text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm max-w-full truncate sm:truncate-0"
                  aria-label={`${business_name} - Acasă`}
              >
                {business_name}
              </Link>

              <p className="mt-2 text-muted-foreground max-w-prose break-words">
                {business_name}{business_short ? ` — ${business_short}` : ''}
                {' '}Experiență culinară premium pe rooftop-ul din centrul orașului.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3" role="list" aria-label="Rețele sociale">
                <div role="listitem">
                  <Link
                      href="https://instagram.com/skycaffe"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-2"
                      aria-label="Instagram"
                      target="_blank" rel="noopener noreferrer"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                </div>
                <div role="listitem">
                  <Link
                      href="https://facebook.com/skycaffe"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm p-2"
                      aria-label="Facebook"
                      target="_blank" rel="noopener noreferrer"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <address className="not-italic" itemScope itemType="https://schema.org/PostalAddress">
                <div className="space-y-3 text-sm text-muted-foreground break-words">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    {/* adresă stabilă, cu newline-uri randate */}
                    <span className="whitespace-pre-line break-words">{addressPretty || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <a
                        href={support_phone ? `tel:${support_phone}` : '#'}
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm"
                        aria-label={`Sună la ${business_name}`}
                    >
                      {support_phone || '-'}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <a
                        href={site_email ? `mailto:${site_email}` : '#'}
                        className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm break-all sm:break-words"
                        aria-label="Trimite email"
                    >
                      {site_email || '-'}
                    </a>
                  </div>

                  {/* Orar static din server (fără salt vizual după mount) */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="min-h-[1.25rem]">{availability_label_with_hours || '-'}</span>
                  </div>
                </div>
              </address>
            </div>

            {/* Navigare */}
            <nav className="min-w-0" aria-label="Navigare footer">
              <h3 className="font-semibold text-foreground mb-4">Navigare</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '/meniu', label: 'Meniul nostru delivery' },
                  { href: '/meniu-digital', label: 'Meniul nostru digital' },
                  { href: '/despre', label: 'Despre noi' },
                  { href: '/checkout', label: 'Comandă online' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/termeni-si-conditii', label: 'Termeni și condiții' },
                  { href: '/politica-de-confidentialitate', label: 'Politica de confidențialitate' },
                ].map(({ href, label }, idx) => (
                    <li key={idx} className="min-w-0">
                      <Link
                          href={href}
                          className="block max-w-full break-words text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-2 rounded-sm py-1"
                      >
                        {label}
                      </Link>
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
                <Link href="/gdpr" className="hover:text-primary transition-colors">GDPR</Link>
                <Link href="/cookies" className="hover:text-primary transition-colors">Cookie-uri</Link>
                <Link href="/sitemap.xml" target="_blank" rel="noopener" className="hover:text-primary transition-colors">Sitemap</Link>
              </div>
            </div>
          </div>
        </div>

        {/* JSON-LD corect (fără obiect în "description") */}
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: business_name,
                alternateName: business_short || business_name,
                url: 'https://skycaffe.ro',
                logo: 'https://skycaffe.ro/logo.png',
                image: 'https://skycaffe.ro/hero.webp',
                description: business_short || `${business_name} — bistro pe rooftop`,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Centrul Năvodari, Rooftop etaj 4',
                  addressLocality: 'Năvodari',
                  addressCountry: 'RO',
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: support_phone || '',
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
  )
}
