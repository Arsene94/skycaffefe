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
  Star, CircleUserRound, Users,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Produse',
    href: '/admin/produse',
    icon: Package,
  },
  {
    name: 'Clienți',
    href: '/admin/clienti',
    icon: CircleUserRound,
  },
  {
    name: 'Categorii',
    href: '/admin/categorii',
    icon: Grid3X3,
  },
  {
    name: 'Oferte',
    href: '/admin/oferte',
    icon: Gift,
  },
  {
    name: 'Recomandate',
    href: '/admin/recomandate',
    icon: Star,
  },
  {
    name: 'Personal',
    href: '/admin/personal',
    icon: Users,
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
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
