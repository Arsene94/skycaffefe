'use client';

import React, { createContext, useContext } from 'react';
import {AppSettings, SETTINGS_DEFAULTS} from "@/types";

const SettingsContext = createContext<AppSettings>(SETTINGS_DEFAULTS);

export function SettingsProvider({
                                     initial,
                                     children,
                                 }: {
    initial: AppSettings;
    children: React.ReactNode;
}) {
    return (
        <SettingsContext.Provider value={initial}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
