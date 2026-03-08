'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ShieldCheck, XCircle } from 'lucide-react';

export default function PairPage() {
    const params = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const pair = async () => {
            try {
                const res = await fetch('/api/manager/pair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: params.token }),
                });

                if (res.ok) {
                    setStatus('success');
                    setTimeout(() => {
                        router.push('/manage');
                    }, 1500);
                } else {
                    setStatus('error');
                }
            } catch (err) {
                setStatus('error');
            }
        };
        if (params.token) pair();
    }, [params.token, router]);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white font-sans">
            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                        <h1 className="text-xl font-bold mb-2">Connecting to TV...</h1>
                        <p className="text-neutral-400 text-sm">Please wait while we establish a secure session.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="bg-emerald-500/10 p-4 rounded-full mb-6 ring-1 ring-emerald-500/30">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h1 className="text-xl font-bold mb-2 text-emerald-400">Connected!</h1>
                        <p className="text-neutral-400 text-sm">Redirecting to management dashboard...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="bg-red-500/10 p-4 rounded-full mb-6 ring-1 ring-red-500/30">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold mb-2 text-red-500">Pairing Failed</h1>
                        <p className="text-neutral-400 text-sm mb-6">The code might be expired or invalid. Please scan the QR code again.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-6 rounded-xl transition-colors w-full"
                        >
                            Go to Homepage
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
