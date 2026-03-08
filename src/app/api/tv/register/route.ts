import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { generateToken, hashToken } from '@/lib/auth';

export async function POST() {
    const token = generateToken(32);
    const hashed = hashToken(token);

    const client = await pool.connect();
    try {
        const res = await client.query(
            'INSERT INTO devices (token_hash, name) VALUES ($1, $2) RETURNING id',
            [hashed, 'TV Device']
        );
        const deviceId = res.rows[0].id;

        // Set a very long-lived cookie for the TV
        const cookieStore = await cookies();
        cookieStore.set('device_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return NextResponse.json({ success: true, deviceId });
    } catch (err) {
        console.error('TV Registration error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
