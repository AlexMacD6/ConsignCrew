import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all zip codes (seller and buyer)
export async function GET() {
  try {
    const zipCodes = await prisma.zipCode.findMany({
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    });
    
    // Also provide the legacy format for any other parts of the app that might need it
    const sellerZipCodes = zipCodes.filter(zip => zip.type === 'seller');
    const buyerZipCodes = zipCodes.filter(zip => zip.type === 'buyer');
    
    return NextResponse.json({ 
      zipCodes, 
      sellerZipCodes, 
      buyerZipCodes 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zip codes' }, { status: 500 });
  }
}

// POST: Add a new zip code
export async function POST(request: NextRequest) {
  try {
    const { code, area, type } = await request.json();
    if (!code || !type) return NextResponse.json({ error: 'Missing code or type' }, { status: 400 });
    const zip = await prisma.zipCode.create({ data: { code, area, type } });
    return NextResponse.json({ zip });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add zip code' }, { status: 500 });
  }
}

// PUT: Edit a zip code
export async function PUT(request: NextRequest) {
  try {
    const { id, code, area, type } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const zip = await prisma.zipCode.update({ where: { id }, data: { code, area, type } });
    return NextResponse.json({ zip });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update zip code' }, { status: 500 });
  }
}

// DELETE: Remove a zip code
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.zipCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete zip code' }, { status: 500 });
  }
} 