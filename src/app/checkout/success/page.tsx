'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://autohue-api.steve-700.workers.dev';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'activating' | 'success' | 'already_done' | 'error'>('activating');
  const [licenseKey, setLicenseKey] = useState('');
  const [tierName, setTierName] = useState('');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription_id') || searchParams.get('token');
    const email = localStorage.getItem('checkout_email');

    if (!subscriptionId || !email) {
      // No subscription ID — maybe they landed here directly
      setStatus('already_done');
      return;
    }

    // Activate the subscription
    fetch(`${API_BASE}/api/paypal/activate-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, email }),
    })
      .then(r => r.json())
      .then((data: any) => {
        if (data.licenseKey) {
          setLicenseKey(data.licenseKey);
          setTierName(data.tierName || '');
          setStatus('success');
          localStorage.removeItem('checkout_email');
          localStorage.removeItem('checkout_tier');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const copyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'activating') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md animate-fade-up">
          <i className="fas fa-spinner fa-spin text-racing-500 text-4xl mb-6 block" />
          <h1 className="text-xl font-heading font-black mb-2">Activating your license...</h1>
          <p className="text-white/40 text-sm">Please wait while we set up your subscription.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md red-accent-top animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-red-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-heading font-black mb-2">Activation Failed</h1>
          <p className="text-white/40 text-sm mb-6">
            Your payment was received but we couldn't activate your license automatically.
            Check your email — your license key may have been sent there.
          </p>
          <p className="text-white/30 text-xs mb-6">
            If you need help, contact <a href="mailto:support@autohue.app" className="text-racing-400 underline">support@autohue.app</a>
          </p>
          <Link href="/dashboard" className="btn-racing px-6 py-2.5 rounded-xl text-sm font-bold">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'already_done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md red-accent-top animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-green-500 text-3xl" />
          </div>
          <h1 className="text-2xl font-heading font-black mb-2">You're All Set!</h1>
          <p className="text-white/40 text-sm mb-6">
            Your license key has been emailed to you. Check your inbox and paste it into the AutoHue desktop app.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-racing px-6 py-2.5 rounded-xl text-sm font-bold">
              <i className="fas fa-key mr-2" />View Dashboard
            </Link>
            <a href="/download" target="_blank" rel="noopener noreferrer" className="btn-carbon px-6 py-2.5 rounded-xl text-sm font-bold">
              <i className="fas fa-download mr-2" />Download App
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card rounded-3xl p-10 text-center max-w-md red-accent-top animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check text-green-500 text-3xl" />
        </div>
        <h1 className="text-2xl font-heading font-black mb-2">Payment Successful!</h1>
        {tierName && <p className="text-racing-400 text-sm font-bold mb-1">{tierName} Plan Activated</p>}
        <p className="text-white/40 text-sm mb-6">
          Your license key is ready. Paste it into AutoHue Desktop to start sorting.
        </p>

        {/* License key display */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
          <div className="text-xs text-white/30 mb-2 font-bold uppercase tracking-wider">Your License Key</div>
          <div className="font-mono text-lg tracking-widest text-racing-400 break-all">{licenseKey}</div>
        </div>

        <button
          onClick={copyKey}
          className="w-full btn-racing py-3 rounded-xl text-sm font-bold mb-4 flex items-center justify-center gap-2"
        >
          {copied ? <><i className="fas fa-check" /> Copied!</> : <><i className="fas fa-copy" /> Copy License Key</>}
        </button>

        <p className="text-white/20 text-xs mb-6">
          Also sent to your email. Redirecting to dashboard in {countdown}s...
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-carbon px-6 py-2.5 rounded-xl text-sm font-bold">
            <i className="fas fa-tachometer-alt mr-2" />Dashboard
          </Link>
          <a href="/download" target="_blank" rel="noopener noreferrer" className="btn-carbon px-6 py-2.5 rounded-xl text-sm font-bold">
            <i className="fas fa-download mr-2" />Download App
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-white/20 text-2xl" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
