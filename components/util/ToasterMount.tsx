// components/util/ToasterMount.tsx
'use client'
import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

export default function ToasterMount() {
    const [ready, setReady] = useState(false)
    useEffect(() => setReady(true), [])
    if (!ready) return null
    return (
        <Toaster
            position="top-center"
            richColors
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                },
            }}
        />
    )
}
