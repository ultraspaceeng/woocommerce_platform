'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/context/theme-context';
import CartDrawer from '@/components/cart/cart-drawer';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            {children}
            <CartDrawer />
        </ThemeProvider>
    );
}
