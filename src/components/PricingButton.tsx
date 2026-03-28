'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://autohue-api.steve-700.workers.dev';

export default function PricingButton({
  plan,
  label,
  popular,
  billing = 'monthly',
}: {
  plan: string;
  label: string;
  popular: boolean;
  billing?: 'monthly' | 'yearly';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      router.push(`/checkout?tier=${plan.toLowerCase()}&billing=${billing}`);
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
        popular ? 'btn-racing' : 'btn-carbon hover:border-racing-600/30'
      }`}
    >
      {loading ? <i className="fas fa-spinner fa-spin" /> : label}
    </button>
  );
}
