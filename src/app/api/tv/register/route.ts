import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/auth';

import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

export async function POST() {
    const token = generateToken(32);
    const hashed = hashToken(token);

    const deviceName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: ' ',
        style: 'capital',
    });

    try {
        const res = await query`INSERT INTO devices (token_hash, name) VALUES (${hashed}, ${deviceName}) RETURNING id`;
        const deviceId = res[0].id;

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
    }
}
