import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { computeExpiry } from '@/lib/time';

export const revalidate = 0;

async function getDeviceFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('manager_token')?.value;
    if (!token) return null;

    const sessionHash = hashToken(token);
    try {
        const res = await query`
            SELECT m.device_id, d.name 
            FROM manager_sessions m
            JOIN devices d ON m.device_id = d.id
            WHERE m.token_hash = ${sessionHash} AND m.expires_at > (NOW() AT TIME ZONE 'UTC')
        `;
        if (res.length === 0) return null;
        return { deviceId: res[0].device_id, deviceName: res[0].name };
    } catch (err) {
        return null;
    }
}

export async function GET() {
    const device = await getDeviceFromSession();
    if (!device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { deviceId, deviceName } = device;

    try {
        const linksRes = await query`
      SELECT id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      FROM links 
      WHERE device_id = ${deviceId} 
        AND is_active = TRUE
      ORDER BY created_at DESC
    `;

        return NextResponse.json({ success: true, links: linksRes, deviceName });
    } catch (err) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const device = await getDeviceFromSession();
    if (!device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { deviceId } = device;

    try {
        const { url, title, expiryMinutes } = await req.json();
        const expiresAt = computeExpiry(expiryMinutes);

        try {
            const inserted = await query`
        INSERT INTO links (device_id, url, title, expires_at)
        VALUES (${deviceId}, ${url}, ${title}, ${expiresAt})
        RETURNING id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      `;

            return NextResponse.json({ success: true, link: inserted[0] });
        } catch (dbErr) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
}
