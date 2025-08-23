'use client';

import {useAuth} from "@/contexts/auth-context";
import React from "react";

export default function Can(props: { role: string, children: React.ReactNode; }) {
    const { user, loading } = useAuth();

    // În timp ce încă nu știm user-ul, nu afișăm (evit flicker)
    if (loading) return null;

    if (!user) return null;

    if (!props.role) return null;

    if (props.role.toLowerCase() === 'admin') {
        if (user.role?.toLowerCase() === 'admin') {
            return <>{props.children}</>;
        }
    }

    if (props.role.toLowerCase() === 'manager') {
        if (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'manager') {
            return <>{props.children}</>;
        }
    }

    if (props.role.toLowerCase() === 'employee') {
        if (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'manager' || user.role?.toLowerCase() === 'employee') {
            return <>{props.children}</>;
        }
    }

    if (user.role?.toLowerCase() === props.role.toLowerCase() || user.role?.toLowerCase() === 'admin') {
        return <>{props.children}</>;
    }

    return null;
}
