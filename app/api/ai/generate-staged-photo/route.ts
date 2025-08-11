/**
 * DALL-E implementation has been disabled and replaced with Pebblely
 * See: app/api/ai/generate-staged-photo-pebblely/route.ts for the new implementation
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'DALL-E implementation has been temporarily disabled. Please use the Pebblely implementation at /api/ai/generate-staged-photo-pebblely',
    redirectTo: '/api/ai/generate-staged-photo-pebblely'
  }, { status: 501 });
} 