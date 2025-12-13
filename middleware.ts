import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require admin authentication
const protectedAdminRoutes = [
    '/admin/dashboard',
    '/admin/products',
    '/admin/orders',
    '/admin/users',
    '/admin/settings',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for maintenance mode via API
    // For performance, we skip this in middleware and handle it client-side

    // Handle admin route protection
    const isProtectedAdminRoute = protectedAdminRoutes.some((route) =>
        pathname.startsWith(route)
    );

    if (isProtectedAdminRoute) {
        // Check for admin token in cookies or headers
        const token = request.cookies.get('admin-token')?.value ||
            request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!token) {
            // Redirect to admin login
            const loginUrl = new URL('/admin', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            // return NextResponse.redirect(loginUrl);
        }

        // Verify token by calling the auth API
        try {
            const response = await fetch(new URL('/api/auth/admin', request.url), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const loginUrl = new URL('/admin', request.url);
                loginUrl.searchParams.set('redirect', pathname);
                // return NextResponse.redirect(loginUrl);
            }
        } catch {
            // If verification fails, redirect to login
            const loginUrl = new URL('/admin', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            // return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    ],
};
