import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please log in to access admin features"
      }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          where: {
            role: {
              in: ['ADMIN', 'OWNER']
            }
          }
        }
      }
    });

    if (!user?.members.length) {
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "Admin access required"
      }, { status: 403 });
    }

    // Get all pending invitations across all organizations
    const invitations = await prisma.invitation.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true,
      invitations: invitations.map((invitation: any) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organization: invitation.organization,
        inviter: invitation.inviter,
        createdAt: invitation.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Failed to fetch invitations"
    }, { status: 500 });
  }
} 