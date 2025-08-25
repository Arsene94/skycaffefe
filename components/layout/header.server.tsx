import Link from 'next/link'
import { cn } from '@/lib/utils'

// insule client minimale (se hidratează după mount)
import { ThemeToggleIsland, UserMenuIsland, CartIsland } from './header-islands'

export async function Header() {
    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
                style={{ ['--site-header-height' as any]: '64px' }}>
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]
                                   bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                        Sky Caffe
                    </Link>

                    <nav className="hidden md:flex items-center space-x-8">
                        {[
                            { href: '/', label: 'Acasă' },
                            { href: '/meniu', label: 'Meniu Delivery' },
                            { href: '/meniu-digital', label: 'Meniu Digital' },
                            { href: '/despre', label: 'Despre' },
                        ].map(i => (
                            <Link key={i.href} href={i.href} className={cn('text-foreground/80 hover:text-primary transition-colors font-medium')}>
                                {i.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-2">
                        <ThemeToggleIsland />
                        <UserMenuIsland />
                        <CartIsland />
                    </div>
                </div>
            </div>
        </header>
    )
}
export default Header
