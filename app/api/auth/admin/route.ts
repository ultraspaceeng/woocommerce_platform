import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'royal-commerce-secret-key-change-in-production';

// POST /api/auth/admin - Admin login
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check against environment variables
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                email,
                role: 'admin',
                iat: Date.now(),
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return NextResponse.json({
            success: true,
            data: {
                email,
                token,
            },
            message: 'Login successful',
        });
    } catch (error) {
        console.error('Error during admin login:', error);
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

// GET /api/auth/admin - Verify token
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };

            return NextResponse.json({
                success: true,
                data: {
                    email: decoded.email,
                    role: decoded.role,
                },
            });
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json(
            { success: false, error: 'Token verification failed' },
            { status: 500 }
        );
    }
}
