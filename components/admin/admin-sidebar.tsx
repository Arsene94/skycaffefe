'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Grid3X3,
  Gift,
  Star,
  CircleUserRound,
  Users,
  MapPin,
  BringToFront,
  QrCode,
  X, Settings,
} from 'lucide-react';
import Can from './Can';
import { useEffect } from 'react';

const navigation = [
  { name: 'Dashboard',    href: '/admin',            icon: LayoutDashboard, role: 'EMPLOYEE' },
  { name: 'Comenzi',      href: '/admin/comenzi',    icon: BringToFront,    role: 'EMPLOYEE' },
  { name: 'Produse',      href: '/admin/produse',    icon: Package,        role: 'MANAGER'  },
  { name: 'Clienți',      href: '/admin/clienti',    icon: CircleUserRound, role: 'EMPLOYEE' },
  { name: 'Categorii',    href: '/admin/categorii',  icon: Grid3X3,        role: 'MANAGER'  },
  { name: 'Oferte',       href: '/admin/oferte',     icon: Gift,           role: 'ADMIN'    },
  { name: 'Recomandate',  href: '/admin/recomandate',icon: Star,           role: 'MANAGER'  },
  { name: 'Personal',     href: '/admin/personal',   icon: Users,          role: 'ADMIN'    },
  { name: 'Zone livrare', href: '/admin/livrari',    icon: MapPin,         role: 'MANAGER'  },
  { name: 'Cod QR',       href: '/admin/codqr',      icon: QrCode,         role: 'MANAGER'  },
  { name: 'Setari',       href: '/admin/setari',      icon: Settings,         role: 'ADMIN'  },
];

export function AdminSidebar({
                               isOpen,
                               onClose,
                               onItemClick,
                             }: {
  isOpen: boolean;
  onClose: () => void;
  onItemClick: () => void;
}) {
  const pathname = usePathname();

  // Lock scroll când meniul mobil e deschis
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const NavList = (
      <nav className="space-y-2" aria-label="Meniu administrare">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
              <Can key={item.name} role={item.role}>
                <Button
                    asChild
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                        'w-full justify-start',
                        isActive && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    )}
                    onClick={onItemClick}
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              </Can>
          );
        })}
      </nav>
  );

  return (
      <>
        {/* Desktop sidebar – neschimbat vizual, doar ascuns pe mobil */}
        <aside className="hidden lg:block w-64 border-r border-border bg-card/50">
          <div className="p-6">{NavList}</div>
        </aside>

        {/* Mobile off-canvas sidebar */}
        {isOpen && (
            <div
                id="admin-mobile-sidebar"
                className="lg:hidden fixed inset-0 z-50"
                role="dialog"
                aria-modal="true"
                aria-label="Meniu administrare"
            >
              {/* Overlay */}
              <div
                  className="absolute inset-0 bg-black/40"
                  onClick={onClose}
                  aria-hidden="true"
              />

              {/* Panel */}
              <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-card border-r border-border shadow-xl transform transition-transform duration-200 ease-out translate-x-0">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-semibold">Meniu</span>
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Închide meniul">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">{NavList}</div>
              </div>
            </div>
        )}
      </>
  );
}
