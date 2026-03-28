'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://autohue-api.steve-700.workers.dev';

type Platform = 'windows' | 'mac' | 'unknown';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  return 'unknown';
}

const PLATFORM_INFO = {
  windows: {
    label: 'Windows',
    icon: 'fa-windows',
    req: 'Windows 10 or later',
  },
  mac: {
    label: 'macOS',
    icon: 'fa-apple',
    req: 'macOS 12 (Monterey) or later',
  },
} as const;

interface ReleaseInfo {
  version: string;
  windows?: { filename: string; size: number };
  mac?: { filename: string; size: number };
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [downloading, setDownloading] = useState(false);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    // Fetch latest release info from API
    fetch(`${API_BASE}/api/releases/latest`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRelease(data); })
      .catch(() => {});
  }, []);

  const handleDownload = (plat: 'windows' | 'mac') => {
    setDownloading(true);
    // Always downloads the latest version — API resolves the newest file
    window.location.href = `${API_BASE}/api/download/latest/${plat}`;
    setTimeout(() => setDownloading(false), 3000);
  };

  const primary = platform === 'mac' ? 'mac' : 'windows';
  const secondary = primary === 'windows' ? 'mac' : 'windows';
  const primaryFile = release?.[primary];
  const secondaryFile = release?.[secondary];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-lg w-full text-center">
        <div className="glass-card rounded-3xl p-10 red-accent-top animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-racing-600/20 border border-racing-600/30 mb-6">
            <i className="fas fa-download text-2xl text-racing-500" />
          </div>

          <h1 className="text-3xl font-heading font-black mb-2">Download AutoHue</h1>
          {release?.version && (
            <p className="text-white/40 text-sm mb-1">Version {release.version}</p>
          )}
          <p className="text-white/20 text-xs mb-8">Sort car photos by color in seconds with AI</p>

          {/* Primary download button */}
          <button
            onClick={() => handleDownload(primary)}
            disabled={downloading}
            className="w-full btn-racing py-4 rounded-xl font-bold text-base mb-3 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {downloading ? (
              <><i className="fas fa-spinner fa-spin" /> Starting download...</>
            ) : (
              <>
                <i className={`fab ${PLATFORM_INFO[primary].icon}`} />
                Download for {PLATFORM_INFO[primary].label}
              </>
            )}
          </button>
          <p className="text-white/20 text-[10px] mb-6">
            {primaryFile ? `${primaryFile.filename} · ${formatSize(primaryFile.size)}` : PLATFORM_INFO[primary].label} · {PLATFORM_INFO[primary].req}
          </p>

          {/* Secondary download */}
          <button
            onClick={() => handleDownload(secondary)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-2 mx-auto mb-8"
          >
            <i className={`fab ${PLATFORM_INFO[secondary].icon}`} />
            Download for {PLATFORM_INFO[secondary].label} instead
            {secondaryFile && <span className="text-white/15">({formatSize(secondaryFile.size)})</span>}
          </button>

          {/* Windows SmartScreen notice */}
          {platform === 'windows' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <i className="fas fa-shield-alt text-blue-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-400 mb-1">Windows SmartScreen Notice</p>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    Windows may show a &ldquo;Windows protected your PC&rdquo; message. This is normal for new software.
                    Click <strong className="text-white/60">&ldquo;More info&rdquo;</strong> then <strong className="text-white/60">&ldquo;Run anyway&rdquo;</strong> to install.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="border-t border-white/5 pt-6">
            <h3 className="text-xs font-bold text-white/30 mb-4 uppercase tracking-wider">Getting Started</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-racing-600/20 text-racing-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm text-white/50">Download and run the installer</p>
                  <p className="text-[10px] text-white/25">If SmartScreen appears: More info &rarr; Run anyway</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-racing-600/20 text-racing-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-sm text-white/50">Enter your license key (or start a free 7-day trial)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-racing-600/20 text-racing-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-sm text-white/50">Drop your car photos and let AI sort them by color</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/20">
          <Link href="/" className="hover:text-white/40 transition-colors">Home</Link>
          <span>&middot;</span>
          <Link href="/#pricing" className="hover:text-white/40 transition-colors">Pricing</Link>
          <span>&middot;</span>
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  );
}
