import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/auth';
import { computeExpiry } from '@/lib/time';

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get('device_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const deviceHash = hashToken(token);

    try {
        // Check if device exists and update last_seen_at
        const deviceRes = await query`UPDATE devices SET last_seen_at = (NOW() AT TIME ZONE 'UTC') WHERE token_hash = ${deviceHash} RETURNING id`;

        if (deviceRes.length === 0) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const deviceId = deviceRes[0].id;

        // Generate QR pair token (3 minutes expiry)
        const pairToken = generateToken(12);
        const pairHash = hashToken(pairToken);
        const expiresAt = computeExpiry(3);

        // Clear old pair tokens for this device
        await query`DELETE FROM pair_tokens WHERE device_id = ${deviceId}`;

        await query`INSERT INTO pair_tokens (device_id, token_hash, expires_at) VALUES (${deviceId}, ${pairHash}, ${expiresAt})`;

        return NextResponse.json({ success: true, pairToken, expiresAt });
    } catch (err) {
        console.error('TV QR error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
