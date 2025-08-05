import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../../lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user?.members.length) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { qualityChecked } = await request.json();

    if (typeof qualityChecked !== "boolean") {
      return NextResponse.json(
        { error: "qualityChecked must be a boolean" },
        { status: 400 }
      );
    }

    // Update the listing
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: { qualityChecked },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error) {
    console.error("Error updating quality check status:", error);
    return NextResponse.json(
      { error: "Failed to update quality check status" },
      { status: 500 }
    );
  }
} 