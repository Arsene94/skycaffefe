'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { LogOut, Sun, Moon, Home, Menu } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";
import { toast } from 'sonner';

export function AdminHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Deconectat cu succes');
    router.push('/');
  };

  return (
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="px-4 sm:px-5 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button (nu afectează desktop) */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onToggleSidebar}
                aria-label="Deschide meniul"
                aria-controls="admin-mobile-sidebar"
                aria-expanded="false"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link
                href="/admin"
                className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent"
            >
              Sky Caffe Admin
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Back to Site */}
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="sr-only">Înapoi la site</span>
              </Link>
            </Button>

            {/* Theme Toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Schimbă tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Schimbă tema</span>
            </Button>

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Deconectare">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Deconectare</span>
            </Button>
          </div>
        </div>
      </header>
  );
}
