import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE: Remove a zip code by ID (URL parameter)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    await prisma.zipCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting zip code:', error);
    return NextResponse.json({ error: 'Failed to delete zip code' }, { status: 500 });
  }
}

// PUT: Update a zip code by ID (URL parameter)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { code, area, type } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const zip = await prisma.zipCode.update({ 
      where: { id }, 
      data: { code, area, type } 
    });
    
    return NextResponse.json({ zip });
  } catch (error) {
    console.error('Error updating zip code:', error);
    return NextResponse.json({ error: 'Failed to update zip code' }, { status: 500 });
  }
}
