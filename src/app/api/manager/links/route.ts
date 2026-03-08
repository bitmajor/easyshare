import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { hashToken } from '@/lib/auth';
import { computeExpiry } from '@/lib/time';

export const revalidate = 0;

async function getDeviceIdFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('manager_token')?.value;
    if (!token) return null;

    const sessionHash = hashToken(token);
    const client = await pool.connect();
    try {
        const res = await client.query(
            'SELECT device_id FROM manager_sessions WHERE token_hash = $1 AND expires_at > NOW()',
            [sessionHash]
        );
        if (res.rowCount === 0) return null;
        return res.rows[0].device_id;
    } finally {
        client.release();
    }
}

export async function GET() {
    const deviceId = await getDeviceIdFromSession();
    if (!deviceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await pool.connect();
    try {
        const linksRes = await client.query(`
      SELECT id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      FROM links 
      WHERE device_id = $1 
        AND is_active = TRUE
      ORDER BY created_at DESC
    `, [deviceId]);

        return NextResponse.json({ success: true, links: linksRes.rows });
    } finally {
        client.release();
    }
}

export async function POST(req: Request) {
    const deviceId = await getDeviceIdFromSession();
    if (!deviceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { url, title, expiryMinutes } = await req.json();
        const expiresAt = computeExpiry(expiryMinutes);

        const client = await pool.connect();
        try {
            const inserted = await client.query(`
        INSERT INTO links (device_id, url, title, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      `, [deviceId, url, title, expiresAt]);

            return NextResponse.json({ success: true, link: inserted.rows[0] });
        } finally {
            client.release();
        }
    } catch (err) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
}
