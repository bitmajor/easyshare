import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { hashToken } from '@/lib/auth';

export const revalidate = 0; // Disable caching

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('device_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const deviceHash = hashToken(token);

    const client = await pool.connect();
    try {
        // Get device ID
        const deviceRes = await client.query(
            'SELECT id FROM devices WHERE token_hash = $1',
            [deviceHash]
        );

        if (deviceRes.rowCount === 0) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const deviceId = deviceRes.rows[0].id;

        // Fetch active non-expired links
        const linksRes = await client.query(`
      SELECT id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      FROM links 
      WHERE device_id = $1 
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [deviceId]);

        return NextResponse.json({ success: true, links: linksRes.rows });
    } catch (err) {
        console.error('TV Links error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
