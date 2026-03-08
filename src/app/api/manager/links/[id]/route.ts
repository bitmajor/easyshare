import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashToken } from '@/lib/auth';

async function getDeviceIdFromSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('manager_token')?.value;
    if (!token) return null;

    const sessionHash = hashToken(token);
    try {
        const res = await query`SELECT device_id FROM manager_sessions WHERE token_hash = ${sessionHash} AND expires_at > (NOW() AT TIME ZONE 'UTC')`;
        if (res.length === 0) return null;
        return res[0].device_id;
    } catch (err) {
        return null;
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const deviceId = await getDeviceIdFromSession();
    if (!deviceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const res = await query`UPDATE links SET is_active = FALSE WHERE id = ${id} AND device_id = ${deviceId} RETURNING id`;

        if (res.length === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Delete link error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
