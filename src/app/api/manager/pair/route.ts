import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { generateToken, hashToken } from '@/lib/auth';
import { computeExpiry } from '@/lib/time';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

        const pairHash = hashToken(token);
        const client = await pool.connect();

        try {
            // Find pair token
            const res = await client.query(
                'SELECT device_id FROM pair_tokens WHERE token_hash = $1 AND expires_at > NOW()',
                [pairHash]
            );

            if (res.rowCount === 0) {
                return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 401 });
            }

            const deviceId = res.rows[0].device_id;

            // Create manager session (30 minutes)
            const sessionToken = generateToken(32);
            const sessionHash = hashToken(sessionToken);
            const expiresAt = computeExpiry(30);

            await client.query(
                'INSERT INTO manager_sessions (device_id, token_hash, expires_at) VALUES ($1, $2, $3)',
                [deviceId, sessionHash, expiresAt]
            );

            // Set cookie
            const cookieStore = await cookies();
            cookieStore.set('manager_token', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 30 * 60, // 30 mins
            });

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Manager pair error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
