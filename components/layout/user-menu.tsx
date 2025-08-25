'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function UserMenu() {
    const { user, loading, logout } = useAuth()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted || loading) return <div className="w-9 h-9" aria-hidden />

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9" aria-label="Meniu utilizator">
                    <UserIcon className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-56">
                {user ? (
                    <>
                        <DropdownMenuLabel className="truncate">{user.name || user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href="/account">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Contul meu</DropdownMenuItem>
                        </Link>
                        <Link href="/account/orders">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Comenzile mele</DropdownMenuItem>
                        </Link>
                        <Link href="/account/addresses">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Adresele mele</DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => logout()}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Delogare
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Autentificare</DropdownMenuItem>
                        </Link>
                        <Link href="/auth/register">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Înregistrare</DropdownMenuItem>
                        </Link>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
