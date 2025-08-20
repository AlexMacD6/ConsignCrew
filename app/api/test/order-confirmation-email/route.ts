import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/order-confirmation-email';
import { prisma } from '@/lib/prisma';

/**
 * Test Order Confirmation Email API
 * 
 * POST /api/test/order-confirmation-email
 * Body: { orderId: 'order_id_here' } or { testEmail: 'email@example.com' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, testEmail } = body;

    // Test with real order data
    if (orderId) {
      console.log('Testing order confirmation email with order ID:', orderId);

      // Fetch order details from database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          listing: true,
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      if (!order) {
        return NextResponse.json({
          success: false,
          error: 'Order not found',
          orderId
        }, { status: 404 });
      }

      if (!order.buyer?.email) {
        return NextResponse.json({
          success: false,
          error: 'No buyer email found for this order',
          orderId
        }, { status: 400 });
      }

      // Send email with real order data
      const result = await sendOrderConfirmationEmail({
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        listing: {
          title: order.listing.title,
          itemId: order.listing.itemId,
          photos: order.listing.photos,
        },
        buyer: {
          name: order.buyer.name || 'Customer',
          email: order.buyer.email,
        },
        seller: order.seller ? {
          name: order.seller.name || 'Seller',
        } : undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
        data: {
          messageId: result.MessageId,
          orderId: order.id,
          buyerEmail: order.buyer.email,
          listingTitle: order.listing.title,
          amount: order.amount,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Test with sample data
    if (testEmail) {
      console.log('Testing order confirmation email with sample data to:', testEmail);

      // Create sample order data for testing
      const sampleOrderData = {
        id: 'test_order_' + Date.now(),
        amount: 89.99,
        createdAt: new Date().toISOString(),
        status: 'PAID',
        listing: {
          title: 'IKEA Black Dresser With Drawer Crack',
          itemId: 'XM5P19',
          photos: null,
        },
        buyer: {
          name: 'Test Customer',
          email: testEmail,
        },
        seller: {
          name: 'Test Seller',
        },
      };

      const result = await sendOrderConfirmationEmail(sampleOrderData);

      return NextResponse.json({
        success: true,
        message: 'Test order confirmation email sent successfully',
        data: {
          messageId: result.MessageId,
          testEmail,
          sampleData: sampleOrderData,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Either orderId or testEmail is required',
      usage: {
        realOrder: 'POST with { "orderId": "actual_order_id" }',
        testEmail: 'POST with { "testEmail": "test@example.com" }'
      }
    }, { status: 400 });

  } catch (error) {
    console.error('Error testing order confirmation email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test order confirmation email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get information about the order confirmation email test endpoint
 * GET /api/test/order-confirmation-email
 */
export async function GET() {
  return NextResponse.json({
    message: 'Order Confirmation Email Test Endpoint',
    usage: {
      testWithRealOrder: {
        method: 'POST',
        body: { orderId: 'actual_order_id' },
        description: 'Send confirmation email using real order data from database'
      },
      testWithSampleData: {
        method: 'POST', 
        body: { testEmail: 'test@example.com' },
        description: 'Send confirmation email using sample data to specified email'
      }
    },
    endpoints: {
      test: '/api/test/order-confirmation-email',
      ses: '/api/test/ses-test'
    }
  });
}
