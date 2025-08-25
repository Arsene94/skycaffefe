'use client'

import dynamic from 'next/dynamic'

// dynamic client chunks (no SSR)
const ThemeToggle = dynamic(() => import('./theme-toggle').then(m => m.ThemeToggle), {
    ssr: false,
    loading: () => <div className="w-9 h-9" aria-hidden />,
})

const UserMenu = dynamic(() => import('./user-menu').then(m => m.UserMenu), {
    ssr: false,
    loading: () => <div className="w-9 h-9" aria-hidden />,
})

const CartButton = dynamic(() => import('./cart-button').then(m => m.CartButton), {
    ssr: false,
    loading: () => <div className="w-9 h-9" aria-hidden />,
})

export function ThemeToggleIsland() {
    return <ThemeToggle />
}

export function UserMenuIsland() {
    return <UserMenu />
}

export function CartIsland() {
    return <CartButton />
}
