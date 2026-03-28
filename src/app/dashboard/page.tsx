'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

interface LicenseData {
  found: boolean;
  licenseKey?: string;
  tier?: string;
  tierName?: string;
  subscriptionStatus?: string;
  expiresAt?: string | null;
  machineSlots?: number;
  machinesUsed?: number;
}

const TIER_LIMITS: Record<string, string> = {
  trial: '50/day',
  hobbyist: '300/day',
  pro: '2,000/day',
  unlimited: '10,000/day',
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/license')
        .then(r => r.json())
        .then(setLicense)
        .catch(() => setLicense({ found: false }))
        .finally(() => setLoading(false));
    }
  }, [status]);

  const copyKey = () => {
    if (!license?.licenseKey) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-racing-500 text-3xl" />
      </div>
    );
  }

  const isActive = license?.subscriptionStatus === 'active' || license?.subscriptionStatus === 'approved';
  const isTrial = license?.tier === 'trial';
  const dailyLimit = license?.tier ? TIER_LIMITS[license.tier] : null;

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="container mx-auto px-6 max-w-4xl mt-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-heading font-black mb-1">
              Welcome back, <span className="text-racing-500">{session?.user?.name || 'Racer'}</span>
            </h1>
            <p className="text-white/40 text-sm">{session?.user?.email}</p>
          </div>
          {license?.found && (
            <span className="inline-flex items-center gap-1.5 bg-racing-600/10 border border-racing-600/20 px-3 py-1.5 rounded-full text-racing-400 text-xs font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {license.tierName || license.tier}
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* License Key Card */}
          {license?.found ? (
            <div className="glass-card rounded-3xl p-6 red-accent-top">
              <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-key text-racing-500" />
                License Key
              </h2>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
                <div className="font-mono text-base tracking-widest text-racing-400 break-all select-all">
                  {license.licenseKey}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={copyKey}
                  className="btn-racing px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
                >
                  {copied ? <><i className="fas fa-check" /> Copied!</> : <><i className="fas fa-copy" /> Copy Key</>}
                </button>
                <a
                  href="/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-carbon px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
                >
                  <i className="fas fa-download" /> Download App
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 red-accent-top">
              <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-key text-racing-500" />
                License Key
              </h2>
              <p className="text-white/40 text-sm mb-4">
                No active license found for this account. Purchase a plan to get started.
              </p>
              <div className="flex gap-2">
                <Link href="/checkout?tier=hobbyist" className="btn-racing px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                  <i className="fas fa-shopping-cart" /> Get a Plan
                </Link>
                <a
                  href="/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-carbon px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
                >
                  <i className="fas fa-download" /> Download Free Trial
                </a>
              </div>
            </div>
          )}

          {/* Subscription Status */}
          {license?.found && (
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="glass-card rounded-2xl p-6">
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Plan</div>
                <div className="text-2xl font-heading font-black text-white">{license.tierName || license.tier}</div>
                {dailyLimit && <div className="text-xs text-white/30 mt-1">{dailyLimit} images</div>}
              </div>
              <div className="glass-card rounded-2xl p-6">
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Status</div>
                <div className={`text-2xl font-heading font-black ${isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isActive ? 'Active' : license.subscriptionStatus}
                </div>
                {isTrial && license.expiresAt && (
                  <div className="text-xs text-white/30 mt-1">
                    Expires {new Date(license.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="glass-card rounded-2xl p-6">
                <div className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">Machines</div>
                <div className="text-2xl font-heading font-black text-white">
                  {license.machinesUsed ?? 0} / {license.machineSlots ?? 1}
                </div>
                <div className="text-xs text-white/30 mt-1">activated</div>
              </div>
            </div>
          )}

          {/* Download Links */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fas fa-download text-white/40" />
              Download AutoHue Desktop
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href="/download"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-racing-600/30 transition-colors"
              >
                <i className="fab fa-windows text-2xl text-white/40" />
                <div>
                  <div className="text-sm font-bold">Windows</div>
                  <div className="text-xs text-white/30">Download .exe installer</div>
                </div>
                <i className="fas fa-external-link-alt text-xs text-white/20 ml-auto" />
              </a>
              <a
                href="/download"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-racing-600/30 transition-colors"
              >
                <i className="fab fa-apple text-2xl text-white/40" />
                <div>
                  <div className="text-sm font-bold">macOS</div>
                  <div className="text-xs text-white/30">Download .dmg installer</div>
                </div>
                <i className="fas fa-external-link-alt text-xs text-white/20 ml-auto" />
              </a>
            </div>
          </div>

          {/* Upgrade prompt for trial/hobbyist */}
          {license?.found && (license.tier === 'trial' || license.tier === 'hobbyist') && (
            <div className="glass-card rounded-3xl p-6 border border-racing-600/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-sm mb-1 flex items-center gap-2">
                    <i className="fas fa-arrow-up text-racing-500" />
                    {license.tier === 'trial' ? 'Upgrade from Trial' : 'Upgrade to Pro'}
                  </h2>
                  <p className="text-white/40 text-xs">
                    {license.tier === 'trial' ? 'Get 300–10,000 images/day with a paid plan.' : 'Get 2,000 images/day, watermark editor, and priority processing.'}
                  </p>
                </div>
                <Link
                  href={`/checkout?tier=${license.tier === 'trial' ? 'hobbyist' : 'pro'}`}
                  className="btn-racing px-5 py-2.5 rounded-xl text-sm shrink-0"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
