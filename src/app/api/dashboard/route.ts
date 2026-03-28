import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  return NextResponse.json({
    plan: subscription?.plan || 'FREE',
    email: session.user.email,
  });
}
