import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update order shipping address
 * PATCH /api/admin/orders/[id]/address
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: {
              select: { slug: true }
            }
          }
        }
      }
    });

    const isAdmin = user?.members?.some(member => 
      member.organization.slug === 'treasurehub-admin' || 
      member.role === 'ADMIN' || 
      member.role === 'OWNER'
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { shippingAddress } = await request.json();

    // Validate required fields
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: params.id }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order with new shipping address
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        shippingAddress: shippingAddress,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: session.user.id
      },
      include: {
        listing: {
          select: {
            itemId: true,
            title: true
          }
        },
        buyer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the address change
    console.log(`Order ${params.id} shipping address updated by admin ${session.user.id}`);

    return NextResponse.json({ 
      success: true,
      order: updatedOrder,
      message: 'Shipping address updated successfully'
    });

  } catch (error) {
    console.error('Error updating order address:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping address' },
      { status: 500 }
    );
  }
}
