'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Monitor, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface Link {
  id: string;
  url: string;
  title: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function TvHome() {
  const [deviceReady, setDeviceReady] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);

  const [deviceName, setDeviceName] = useState<string>('TV Device');

  const qrRef = useRef<Date | null>(null);
  useEffect(() => {
    qrRef.current = qrExpiry;
  }, [qrExpiry]);

  // Registration & QR
  useEffect(() => {
    const initTv = async () => {
      // Try to get links to check auth
      const linksRes = await fetch('/api/tv/links');
      if (linksRes.status === 401) {
        const regRes = await fetch('/api/tv/register', { method: 'POST' });
        if (!regRes.ok) return;
      } else if (linksRes.ok) {
        const data = await linksRes.json();
        if (data.deviceName) setDeviceName(data.deviceName);
      }
      setDeviceReady(true);
      fetchQr();
    };

    const fetchQr = async () => {
      const res = await fetch('/api/tv/qr', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setQrToken(data.pairToken);
        setQrExpiry(new Date(data.expiresAt));
      }
    };

    initTv();
  }, []);

  // QR Countdown & Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = qrRef.current;
      if (!expiry) return;

      const now = new Date();
      const diff = Math.floor((expiry.getTime() - now.getTime()) / 1000);

      if (diff <= 0) {
        setQrSecondsLeft(0);
        // Refresh QR
        fetch('/api/tv/qr', { method: 'POST' })
          .then(r => r.json())
          .then(data => {
            if (data.pairToken) {
              setQrToken(data.pairToken);
              setQrExpiry(new Date(data.expiresAt));
              qrRef.current = new Date(data.expiresAt);
            }
          });
      } else {
        setQrSecondsLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Links Polling
  useEffect(() => {
    if (!deviceReady) return;

    const fetchLinks = async () => {
      const res = await fetch('/api/tv/links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links);
        if (data.deviceName) setDeviceName(data.deviceName);
      }
    };

    fetchLinks();
    const interval = setInterval(fetchLinks, 3000);
    return () => clearInterval(interval);
  }, [deviceReady]);

  if (!deviceReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin w-12 h-12 text-blue-500 mb-4" />
        <h1 className="text-xl font-medium tracking-wide">Initializing Display...</h1>
      </div>
    );
  }

  const pairUrl = typeof window !== 'undefined' && qrToken ? `${window.location.origin}/pair/${qrToken}` : '';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar: QR Code */}
      <div className="w-full md:w-[360px] bg-neutral-900 rounded-3xl p-8 shadow-2xl border border-neutral-800/50 flex flex-col items-center">
        <div className="bg-blue-500/10 p-5 rounded-2xl mb-6 ring-1 ring-blue-500/20">
          <Monitor className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 break-all text-center">{deviceName}</h2>
        <p className="text-neutral-400 text-center mb-8 text-sm">
          Scan to manage links on this display.
        </p>

        {qrToken && pairUrl ? (
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-white/5 mb-6 ring-4 ring-neutral-800">
            <QRCodeSVG value={pairUrl} size={220} />
          </div>
        ) : (
          <div className="w-[252px] h-[252px] bg-neutral-800 rounded-3xl animate-pulse mb-6" />
        )}

        <div className="text-xs font-mono text-neutral-400 flex items-center mb-auto">
          <span className="bg-neutral-800/50 px-3 py-1.5 rounded-md line-clamp-1 border border-neutral-800">
            Code refreshes in {qrSecondsLeft}s
          </span>
        </div>

        <div className="w-full bg-neutral-800 h-px mt-8 mb-6" />
        <p className="text-xs text-neutral-500 text-center uppercase tracking-widest font-bold">
          EasyShare
        </p>
      </div>

      {/* Main Content: Links */}
      <div className="flex-1 bg-neutral-900/50 rounded-3xl p-8 lg:p-12 border border-neutral-800/30 overflow-y-auto">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-neutral-800">
          <div className="bg-emerald-500/10 p-3 rounded-xl ring-1 ring-emerald-500/20">
            <LinkIcon className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Active Links</h1>
            <p className="text-neutral-400 text-sm">Scan the QR code to send links instantly</p>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30">
            <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
              <LinkIcon className="w-8 h-8 text-neutral-600" />
            </div>
            <div className="text-neutral-400 font-medium mb-1">No links shared yet</div>
            <div className="text-neutral-500 text-sm text-center max-w-xs">Scan the QR code on the left and start pushing links to this screen!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group block p-6 bg-neutral-900 rounded-2xl hover:bg-neutral-800 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5 border border-neutral-800 hover:border-emerald-500/30"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="bg-neutral-800 p-2.5 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                    <LinkIcon className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-2 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                  {link.title || link.url}
                </h3>
                <p className="text-xs text-neutral-500 truncate mt-auto">
                  {link.url}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}