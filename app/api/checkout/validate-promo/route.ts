import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const promo = await prisma.promoCode.findFirst({ where: { code: code.toUpperCase(), isActive: true } });
    if (!promo) return NextResponse.json({ valid: false, reason: 'invalid' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return NextResponse.json({ valid: false, reason: 'expired' });
    if (promo.maxRedemptions && promo.timesRedeemed >= promo.maxRedemptions) return NextResponse.json({ valid: false, reason: 'redeemed' });

    const base = typeof subtotal === 'number' ? subtotal : 0;
    let discount = 0;
    if (promo.discountType === 'PERCENT') discount = Math.max(0, Math.min(base, (promo.value / 100) * base));
    else discount = Math.max(0, Math.min(base, promo.value));

    return NextResponse.json({ valid: true, discount, promo: { code: promo.code, type: promo.discountType, value: promo.value } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
  }
}


