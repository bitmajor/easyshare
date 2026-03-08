import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { hashToken } from '@/lib/auth';

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

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const deviceId = await getDeviceIdFromSession();
    if (!deviceId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const client = await pool.connect();
    try {
        const res = await client.query(
            'UPDATE links SET is_active = FALSE WHERE id = $1 AND device_id = $2 RETURNING id',
            [id, deviceId]
        );

        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Delete link error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
