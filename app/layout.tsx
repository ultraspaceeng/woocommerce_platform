import type { Metadata } from 'next';
import Providers from './providers';
import './global.css';

import {Bricolage_Grotesque} from 'next/font/google';

const font = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-bricolage-grotesque',
});

export const metadata: Metadata = {
    title: 'Royal Commerce | Premium Shopping Experience',
    description: 'Discover premium products with Royal Commerce - your destination for quality physical and digital goods.',
    keywords: ['e-commerce', 'shopping', 'premium products', 'digital goods', 'royal commerce'],
    authors: [{ name: 'Royal Commerce' }],
    openGraph: {
        title: 'Royal Commerce | Premium Shopping Experience',
        description: 'Discover premium products with Royal Commerce',
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
                </Providers>
            </body>
        </html>
    );
}

