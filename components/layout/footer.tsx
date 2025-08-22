import Link from 'next/link';
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent"
            >
              Sky Caffe
            </Link>
            <p className="mt-2 text-muted-foreground max-w-md">
              Sky Caffe — bistro la înălțime, cu livrare rapidă în Năvodari. 
              Experiență culinară premium pe rooftop-ul din centrul orașului.
            </p>
            <div className="flex space-x-4 mt-4">
              <Link 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Rooftop, etaj 4<br />Centrul Năvodari</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>0751 123 456</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>L–D: 10:00–22:30</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigare</h3>
            <div className="space-y-2 text-sm">
              <Link 
                href="/meniu" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Meniul nostru
              </Link>
              <Link 
                href="/despre" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Despre noi
              </Link>
              <Link 
                href="/checkout" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Comandă online
              </Link>
              <Link 
                href="/admin/login" 
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sky Caffe. Toate drepturile rezervate.</p>
          <p className="mt-1">Bistro la înălțime în Năvodari</p>
        </div>
      </div>
    </footer>
  );
}