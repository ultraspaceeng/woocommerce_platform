'use client';

import { useEffect, useRef } from 'react';

export default function PageTracker() {
    const trackedRef = useRef(false);

    useEffect(() => {
        // Prevent double counting in React Strict Mode or fast re-renders
        if (trackedRef.current) return;

        // Check if already tracked in this session to avoid counting reloads/navigation as new views excessively
        // Optional: Remove this check if you want to count every page load
        const sessionKey = 'view_tracked_' + new Date().toISOString().split('T')[0];
        if (localStorage.getItem(sessionKey)) {
            trackedRef.current = true;
            return;
        }

        const trackView = async () => {
            try {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'view' }),
                });
                localStorage.setItem(sessionKey, 'true');
                trackedRef.current = true;
            } catch (error) {
                console.error('Failed to track view:', error);
            }
        };

        trackView();
    }, []);

    return null;
}
