'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      setProfileName(session?.user?.name || '');
      fetch('/api/license')
        .then(r => r.json())
        .then(setLicense)
        .catch(() => setLicense({ found: false }));
    }
  }, [status, session]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-racing-500 text-3xl" />
      </div>
    );
  }

  const isActive = license?.subscriptionStatus === 'active' || license?.subscriptionStatus === 'approved';

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="container mx-auto px-6 max-w-4xl mt-10">
        <h1 className="text-3xl font-heading font-black mb-2">Account Settings</h1>
        <p className="text-white/40 text-sm mb-10">Manage your subscription and profile</p>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="glass-card rounded-3xl p-6 red-accent-top">
            <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fas fa-crown text-racing-500" />
              Subscription
            </h2>
            {license?.found ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xl font-heading font-black text-white">{license.tierName || license.tier}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span className="text-xs text-white/40 capitalize">{license.subscriptionStatus}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {license.tier !== 'unlimited' && (
                    <Link
                      href={`/checkout?tier=${license.tier === 'trial' ? 'hobbyist' : license.tier === 'hobbyist' ? 'pro' : 'unlimited'}`}
                      className="btn-racing px-5 py-2.5 rounded-xl text-sm"
                    >
                      <i className="fas fa-arrow-up mr-1" />Upgrade
                    </Link>
                  )}
                  <a
                    href="https://www.paypal.com/myaccount/autopay/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-carbon px-5 py-2.5 rounded-xl text-sm"
                  >
                    <i className="fab fa-paypal mr-1" />Manage on PayPal
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xl font-heading font-black text-white/40">No Active Plan</div>
                  <div className="text-xs text-white/30 mt-1">Purchase a plan to get your license key</div>
                </div>
                <Link href="/checkout?tier=hobbyist" className="btn-racing px-5 py-2.5 rounded-xl text-sm">
                  <i className="fas fa-shopping-cart mr-1" />Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Machine activations */}
          {license?.found && (
            <div className="glass-card rounded-3xl p-6">
              <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-laptop text-white/40" />
                Machine Activations
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-heading font-black text-white">
                    {license.machinesUsed ?? 0} / {license.machineSlots ?? 1}
                  </div>
                  <div className="text-xs text-white/30 mt-1">machines activated</div>
                </div>
                <div className="text-xs text-white/30 max-w-[200px] text-right">
                  Activate your license in the desktop app on each machine you use.
                </div>
              </div>
            </div>
          )}

          {/* Profile */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
              <i className="fas fa-user text-white/40" />
              Profile
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white/30 mb-2 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:border-racing-600/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/30 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed"
                />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-carbon mt-4 px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              {saving ? <i className="fas fa-spinner fa-spin" /> : saved ? <><i className="fas fa-check text-green-400" /> Saved!</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
