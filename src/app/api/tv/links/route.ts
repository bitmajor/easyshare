import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashToken } from '@/lib/auth';

export const revalidate = 0; // Disable caching

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('device_token')?.value;

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const deviceHash = hashToken(token);

  try {
    // Get device ID and name
    const deviceRes = await query`SELECT id, name FROM devices WHERE token_hash = ${deviceHash}`;

    if (deviceRes.length === 0) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const deviceId = deviceRes[0].id;
    const deviceName = deviceRes[0].name;

    // Fetch active non-expired links
    const linksRes = await query`
      SELECT id, url, title, expires_at as "expiresAt", created_at as "createdAt"
      FROM links 
      WHERE device_id = ${deviceId} 
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > (NOW() AT TIME ZONE 'UTC'))
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, links: linksRes, deviceName });
  } catch (err) {
    console.error('TV Links error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
