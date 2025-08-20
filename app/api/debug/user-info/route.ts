import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's organization memberships
    const memberships = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    });

    // Calculate permissions based on organization membership
    const isSeller = memberships.some(member => 
      member.organization.slug === 'sellers' && 
      member.role === 'member'
    );
    
    const isBuyer = memberships.some(member => 
      member.organization.slug === 'buyers' && 
      member.role === 'member'
    );

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      database: user,
      organizations: memberships.map(m => ({
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      })),
      permissions: {
        canListItems: isSeller,
        canBuyItems: isBuyer,
        isSeller,
        isBuyer,
      }
    });

  } catch (error) {
    console.error('Debug user info error:', error);
    return NextResponse.json({ 
      error: "Failed to get user info",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
