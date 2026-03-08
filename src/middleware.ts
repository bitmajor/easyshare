import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('manager_token')?.value;

    // Protect /manage routes
    if (req.nextUrl.pathname.startsWith('/manage')) {
        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/manage/:path*'],
};
