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
} from 'lucide-react';
import Can from './Can';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    role: 'EMPLOYEE'
  },
  {
    name: 'Comenzi',
    href: '/admin/comenzi',
    icon: BringToFront,
    role: 'EMPLOYEE'
  },
  {
    name: 'Produse',
    href: '/admin/produse',
    icon: Package,
    role: 'MANAGER'
  },
  {
    name: 'Clienți',
    href: '/admin/clienti',
    icon: CircleUserRound,
    role: 'EMPLOYEE'
  },
  {
    name: 'Categorii',
    href: '/admin/categorii',
    icon: Grid3X3,
    role: 'MANAGER'
  },
  {
    name: 'Oferte',
    href: '/admin/oferte',
    icon: Gift,
    role: 'ADMIN'
  },
  {
    name: 'Recomandate',
    href: '/admin/recomandate',
    icon: Star,
    role: 'MANAGER'
  },
  {
    name: 'Personal',
    href: '/admin/personal',
    icon: Users,
    role: 'ADMIN'
  },
  {
    name: 'Zone livrare',
    href: '/admin/livrari',
    icon: MapPin,
    role: 'MANAGER'
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/50">
      <div className="p-6">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
                <Can
                    key={item.name}
                    role={item.role}
                >
                <Button
                  key={item.name}
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  )}
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
      </div>
    </aside>
  );
}
