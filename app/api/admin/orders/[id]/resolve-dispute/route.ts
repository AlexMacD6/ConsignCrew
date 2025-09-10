import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * PATCH /api/admin/orders/[id]/resolve-dispute
 * Resolve a disputed order with admin comments
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if user is admin
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your admin check logic)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isAdmin = user?.role === 'ADMIN' || user?.email === 'alex.macdonald@treasurehub.club';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { resolution, adminComments } = await request.json();

    // Validate required fields
    if (!resolution || !adminComments) {
      return NextResponse.json(
        { error: 'Resolution and admin comments are required' }, 
        { status: 400 }
      );
    }

    // Validate resolution type
    const validResolutions = ['RETURNED', 'REFUNDED', 'FINALIZED'];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type' }, 
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            itemId: true,
            title: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is disputed
    if (order.status !== 'DISPUTED') {
      return NextResponse.json(
        { error: 'Order is not in disputed status' }, 
        { status: 400 }
      );
    }

    // Determine new order status based on resolution
    let newStatus = order.status;
    const updateData: any = {
      disputeResolvedAt: new Date(),
      disputeResolution: resolution,
      disputeAdminComments: adminComments,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: session.user.id,
    };

    // Update order status based on resolution
    switch (resolution) {
      case 'RETURNED':
        // Keep as DISPUTED but mark as resolved - you might want a RETURNED status
        newStatus = 'CANCELLED'; // or create a RETURNED status
        break;
      case 'REFUNDED':
        newStatus = 'REFUNDED';
        break;
      case 'FINALIZED':
        newStatus = 'FINALIZED';
        updateData.finalizedAt = new Date();
        break;
    }

    updateData.status = newStatus;

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            itemId: true,
            title: true,
          },
        },
      },
    });

    // TODO: Send notification email to customer about dispute resolution
    // You might want to create email templates for different resolution types

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Dispute resolved as ${resolution.toLowerCase()}`,
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
