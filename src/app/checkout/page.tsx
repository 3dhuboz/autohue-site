'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://autohue-api.steve-700.workers.dev';

const PLAN_INFO: Record<string, { name: string; monthly: number; yearly: number; daily: string; features: string[] }> = {
  hobbyist: { name: 'Hobbyist', monthly: 24, yearly: 19, daily: '300/day', features: ['300 images per day', 'AI vision engine', '12 color categories', 'ZIP export', 'Email support'] },
  pro: { name: 'Pro', monthly: 99, yearly: 79, daily: '2,000/day', features: ['2,000 images per day', 'Watermark editor', 'Priority AI processing', 'Batch folders & ZIPs'] },
  unlimited: { name: 'Unlimited', monthly: 249, yearly: 199, daily: '10,000/day', features: ['10,000 images per day', 'Commercial use license', 'Dedicated support', 'Multi-machine (2 PCs)'] },
};

// PayPal Plan IDs — set these in your PayPal dashboard (monthly + yearly)
const PAYPAL_PLAN_IDS: Record<string, Record<string, string>> = {
  hobbyist: {
    monthly: process.env.NEXT_PUBLIC_PAYPAL_HOBBYIST_PLAN_ID || '',
    yearly: process.env.NEXT_PUBLIC_PAYPAL_HOBBYIST_YEARLY_PLAN_ID || '',
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID || '',
    yearly: process.env.NEXT_PUBLIC_PAYPAL_PRO_YEARLY_PLAN_ID || '',
  },
  unlimited: {
    monthly: process.env.NEXT_PUBLIC_PAYPAL_UNLIMITED_PLAN_ID || '',
    yearly: process.env.NEXT_PUBLIC_PAYPAL_UNLIMITED_YEARLY_PLAN_ID || '',
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tier') || 'pro';
  const billingParam = (searchParams.get('billing') || 'yearly') as 'monthly' | 'yearly';
  const [tier, setTier] = useState(tierParam);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>(billingParam);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLAN_INFO[tier] || PLAN_INFO.pro;
  const price = billing === 'yearly' ? plan.yearly : plan.monthly;
  const planId = PAYPAL_PLAN_IDS[tier]?.[billing] || '';

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!planId) {
      setError('PayPal plan not configured for this tier');
      return;
    }

    setLoading(true);
    setError('');

    // Store email for the success page to use during activation
    localStorage.setItem('checkout_email', email.trim());
    localStorage.setItem('checkout_tier', tier);
    localStorage.setItem('checkout_billing', billing);

    const origin = window.location.origin;

    try {
      const res = await fetch(`${API_BASE}/api/paypal/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billing,
          email: email.trim(),
          planId,
          returnUrl: `${origin}/checkout/success`,
          cancelUrl: `${origin}/checkout/cancel`,
        }),
      });

      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        setError(data.error || 'Failed to create subscription');
      }
    } catch {
      setError('Connection failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24">
      <div className="glass-card rounded-3xl p-8 max-w-lg w-full red-accent-top animate-fade-up">
        <Link href="/#pricing" className="text-white/30 hover:text-white/50 text-xs flex items-center gap-1.5 mb-6 transition-colors">
          <i className="fas fa-arrow-left text-[10px]" /> Back to pricing
        </Link>

        <h1 className="text-2xl font-heading font-black mb-2">
          Subscribe to <span className="text-racing-500">{plan.name}</span>
        </h1>
        <p className="text-white/40 text-sm mb-2">
          ${price}/{billing === 'yearly' ? 'mo' : 'mo'} &middot; {plan.daily} &middot; Cancel anytime
        </p>
        {billing === 'yearly' && (
          <p className="text-green-400/70 text-xs mb-6">
            Billed ${price * 12}/yr &middot; Save ${(plan.monthly - plan.yearly) * 12}/yr vs monthly
          </p>
        )}
        {billing === 'monthly' && <div className="mb-6" />}

        {/* Billing toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setBilling('monthly')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              billing === 'monthly'
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
              billing === 'yearly'
                ? 'bg-racing-600/20 border border-racing-600/40 text-racing-400'
                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            Yearly
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold">
              -20%
            </span>
          </button>
        </div>

        {/* Tier selector */}
        <div className="flex gap-2 mb-6">
          {Object.entries(PLAN_INFO).map(([key, p]) => {
            const tierPrice = billing === 'yearly' ? p.yearly : p.monthly;
            return (
              <button
                key={key}
                onClick={() => { setTier(key); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tier === key
                    ? 'bg-racing-600/20 border border-racing-600/40 text-racing-400'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                {p.name}
                <br />
                <span className="text-[10px] opacity-60">${tierPrice}/mo</span>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-white/50">
              <i className="fas fa-check text-racing-500 text-[10px]" /> {f}
            </li>
          ))}
        </ul>

        {/* Email input */}
        <label className="block text-xs text-white/40 mb-1.5">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-racing-500/50 mb-4"
        />

        {error && (
          <p className="text-red-400 text-xs mb-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {error}
          </p>
        )}

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full btn-racing py-3.5 rounded-xl font-bold text-sm disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin" /> Connecting to PayPal...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <i className="fab fa-paypal" /> Subscribe with PayPal — ${price}/{billing === 'yearly' ? 'mo (billed yearly)' : 'mo'}
            </span>
          )}
        </button>

        <p className="text-center text-white/20 text-[10px] mt-4">
          Your license key will be emailed after payment. Activate it in the AutoHue desktop app.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><i className="fas fa-spinner fa-spin text-white/20 text-2xl" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
