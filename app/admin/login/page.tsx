'use client';

import {useEffect, useState} from 'react';
import PinLogin from "@/app/admin/login/PinLogin";
import EmailLogin from "@/app/admin/login/EmailLogin";

const SKY_CAFFE_COORDS = {
    lat: 44.32161321810359,
    lon: 28.60890317804252,
};

const MAX_DISTANCE_METERS = 75;

function isNearTarget(lat: number, lon: number, targetLat: number, targetLon: number, maxMeters = 50) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters

    const dLat = toRad(targetLat - lat);
    const dLon = toRad(targetLon - lon);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) * Math.cos(toRad(targetLat)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= maxMeters;
}

export default function AdminLoginPage() {
    const [authMode, setAuthMode] = useState<'pin' | 'email' | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        if (!navigator.geolocation) {
            setDebugInfo('Geolocation not supported');
            setAuthMode('email');
            return;
        }

        setDebugInfo('Getting location...');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                const near = isNearTarget(
                    latitude,
                    longitude,
                    SKY_CAFFE_COORDS.lat,
                    SKY_CAFFE_COORDS.lon,
                    MAX_DISTANCE_METERS
                );

                setDebugInfo(`Lat: ${latitude}, Lon: ${longitude}, Accuracy: ${accuracy}m, Near: ${near}`);
                setAuthMode(near ? 'pin' : 'email');
            },
            (error) => {
                console.error('Geolocation error:', error);
                setDebugInfo(`Location error: ${error.message}`);
                setAuthMode('email');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, []);

    if (authMode === null) {
        return (
            <div className="text-center p-4">
                <p>Se detectează locația...</p>
                {debugInfo && <p className="text-sm text-gray-600 mt-2">{debugInfo}</p>}
            </div>
        );
    }


    return authMode === 'pin' ? <PinLogin /> : <EmailLogin />;
}
