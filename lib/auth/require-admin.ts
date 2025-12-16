import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'royal-commerce-secret-key-change-in-production';

export interface AdminVerifyResult {
    success: boolean;
    email?: string;
    error?: string;
}

/**
 * Verify admin JWT token from request headers.
 * Admin access is controlled at login by validating against ADMIN_EMAIL/ADMIN_PASSWORD env vars,
 * so here we just need to verify the JWT signature and expiration.
 */
export function verifyAdminToken(request: Request): AdminVerifyResult {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
        return { success: true, email: decoded.email };
    } catch {
        return { success: false, error: 'Invalid or expired token' };
    }
}

/**
 * Middleware guard for admin-protected routes.
 * Returns a 401 response if not authorized, or null if authorized.
 * 
 * Usage in route handler:
 * ```
 * const authError = requireAdmin(request);
 * if (authError) return authError;
 * // ...proceed with handler logic
 * ```
 */
export function requireAdmin(request: Request): NextResponse | null {
    const result = verifyAdminToken(request);

    if (!result.success) {
        return NextResponse.json(
            { success: false, error: result.error },
            { status: 401 }
        );
    }

    return null; // null means authorized, proceed
}
