'use client';

import { useState, useEffect } from 'react';
import { LinkIcon, Clock, Plus, Trash2, ExternalLink, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Link {
    id: string;
    url: string;
    title: string;
    expiresAt: string | null;
    createdAt: string;
}

export default function ManagePage() {
    const [links, setLinks] = useState<Link[]>([]);
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [expiryMinutes, setExpiryMinutes] = useState('5');
    const [loading, setLoading] = useState(false);
    const [deviceName, setDeviceName] = useState<string>('Connected to TV');
    const router = useRouter();

    const fetchLinks = async () => {
        const res = await fetch('/api/manager/links');
        if (res.ok) {
            const data = await res.json();
            setLinks(data.links);
            if (data.deviceName) setDeviceName(`Connected to ${data.deviceName}`);
        } else if (res.status === 401) {
            router.push('/');
        }
    };

    useEffect(() => {
        fetchLinks();
        const interval = setInterval(fetchLinks, 5000);
        return () => clearInterval(interval);
    }, [router]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);

        // Auto-prefix http if missing
        let finalUrl = url;
        if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;

        try {
            const res = await fetch('/api/manager/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: finalUrl,
                    title,
                    expiryMinutes: expiryMinutes === 'none' ? null : parseInt(expiryMinutes, 10),
                }),
            });

            if (res.ok) {
                setUrl('');
                setTitle('');
                fetchLinks();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/manager/links/${id}`, { method: 'DELETE' });
            fetchLinks();
        } catch (e) { }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 font-sans max-w-2xl mx-auto">
            <header className="py-6 border-b border-neutral-800 mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Active Session</h1>
                    <p className="text-emerald-400 text-xs font-medium mt-1 flex items-center gap-1.5 truncate max-w-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        {deviceName}
                    </p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-neutral-400 shadow-sm">
                    <Monitor className="w-5 h-5" />
                </div>
            </header>

            {/* Add form */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl mb-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-400" />
                    Send New Link
                </h2>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">URL</label>
                        <input
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="example.com"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm leading-relaxed"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Title (Optional)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="My Presentation"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm leading-relaxed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Expiry Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <select
                                value={expiryMinutes}
                                onChange={e => setExpiryMinutes(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none text-sm leading-relaxed"
                            >
                                <option value="1">1 Minute</option>
                                <option value="5">5 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="none">No Expiry</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                    >
                        {loading ? <span className="animate-spin text-xl leading-none">⟳</span> : 'Push to TV'}
                    </button>
                </form>
            </section>

            {/* Links List */}
            <section>
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Active Links</span>
                    <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full text-xs">{links.length}</span>
                </h2>
                <div className="space-y-3">
                    {links.length === 0 ? (
                        <div className="text-center py-10 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-3xl">
                            <LinkIcon className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                            <p className="text-neutral-400 text-sm">No active links</p>
                        </div>
                    ) : (
                        links.map(link => (
                            <div key={link.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-neutral-700 transition-colors">
                                <div className="bg-neutral-800 p-3 rounded-xl shrink-0">
                                    <LinkIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white truncate">{link.title || link.url}</h3>
                                    <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-neutral-500 hover:text-blue-400 truncate flex items-center gap-1 mt-0.5 transition-colors">
                                        {link.url}
                                        <ExternalLink className="w-3 h-3 block" />
                                    </a>
                                </div>
                                <button
                                    onClick={() => handleDelete(link.id)}
                                    className="p-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                                    aria-label="Delete link"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
