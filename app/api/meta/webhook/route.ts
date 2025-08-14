import { NextRequest, NextResponse } from 'next/server';
import { metaPixelAPI } from '@/lib/meta-pixel-api';

/**
 * Meta Webhook endpoint for real-time catalog updates
 * This allows Meta to receive instant notifications about product changes
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (you should implement this for production)
    // const signature = request.headers.get('x-hub-signature-256');
    // if (!verifyWebhookSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    console.log('Meta webhook received:', body);
    
    // Handle different webhook types
    const { object, entry } = body;
    
    if (object === 'page' && entry) {
      // Handle page-related webhooks
      for (const pageEntry of entry) {
        if (pageEntry.changes) {
          for (const change of pageEntry.changes) {
            console.log('Page change detected:', change);
            // Process page changes if needed
          }
        }
      }
    }
    
    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
    
  } catch (error) {
    console.error('Error processing Meta webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification for Meta
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  // Verify the webhook setup
  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('Meta webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * Verify webhook signature (implement for production security)
 */
function verifyWebhookSignature(signature: string | null, body: any): boolean {
  // TODO: Implement signature verification using your app secret
  // This is a placeholder - you should implement proper verification
  return true;
}
