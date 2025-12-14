import type { Metadata } from 'next';
import Providers from './providers';
import CartDrawer from '@/components/cart/cart-drawer';
import Toast from '@/components/ui/Toast';
import './global.css';

import { Bricolage_Grotesque } from 'next/font/google';

const font = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-bricolage-grotesque',
});

export const metadata: Metadata = {
    title: 'UltraSpaceStore | Premium Shopping Experience',
    description: 'Discover premium products with UltraSpaceStore - your destination for quality physical and digital goods.',
    keywords: ['e-commerce', 'shopping', 'premium products', 'digital goods', 'ultraspace store'],
    authors: [{ name: 'UltraSpaceStore' }],
    openGraph: {
        title: 'UltraSpaceStore | Premium Shopping Experience',
        description: 'Discover premium products with UltraSpaceStore',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={font.variable}>
                <Providers>
                    {children}
                    <CartDrawer />
                    <Toast />
                </Providers>
            </body>
        </html>
    );
}

