import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/auth';
import { computeExpiry } from '@/lib/time';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

        const pairHash = hashToken(token);

        try {
            // Find pair token
            const res = await query`SELECT device_id FROM pair_tokens WHERE token_hash = ${pairHash} AND expires_at > (NOW() AT TIME ZONE 'UTC')`;

            if (res.length === 0) {
                return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 401 });
            }

            const deviceId = res[0].device_id;

            // Create manager session (30 minutes)
            const sessionToken = generateToken(32);
            const sessionHash = hashToken(sessionToken);
            const expiresAt = computeExpiry(30);

            await query`INSERT INTO manager_sessions (device_id, token_hash, expires_at) VALUES (${deviceId}, ${sessionHash}, ${expiresAt})`;

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
        } catch (err) {
            console.error('Manager pair query error:', err);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
    } catch (err) {
        console.error('Manager pair error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
