'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/5 glass-card-solid sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="AutoHue" width={44} height={44} className="w-11 h-11 object-contain" priority />
          <span className="font-heading text-lg font-bold">
            <span className="text-white">Auto</span>
            <span className="text-racing-500">Hue</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <a href="/#how-it-works" className="text-white/40 hover:text-white transition-colors">How It Works</a>
          <a href="/#features" className="text-white/40 hover:text-white transition-colors">Features</a>
          <a href="/#pricing" className="text-white/40 hover:text-white transition-colors">Pricing</a>
          <Link
            href="/download"
            className={`btn-racing px-4 py-1.5 rounded-lg text-xs font-bold ${pathname === '/download' ? 'opacity-70' : ''}`}
          >
            Download
          </Link>
        </nav>
      </div>
    </header>
  );
}
