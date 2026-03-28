import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

const API_BASE = process.env.WORKER_API_URL || 'https://autohue-api.steve-700.workers.dev';

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = session.user.email;
  if (!email) {
    return NextResponse.json({ found: false });
  }

  try {
    const res = await fetch(`${API_BASE}/api/license/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ found: false, error: 'lookup failed' });
  }
}
