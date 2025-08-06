import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for treasure drop data
const treasureDropSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius: z.number().min(50).max(5000, "Radius must be between 50 and 5000 feet"),
  clue: z.string().min(1, "Clue is required"),
  reward: z.string().min(1, "Reward is required"),
  image: z.string().optional(),
  treasureCode: z.string().length(6, "Treasure code must be 6 characters").toUpperCase(),
});

export async function GET() {
  try {
    const drops = await prisma.treasureDrop.findMany({
      include: {
        treasureCode: {
          select: {
            id: true,
            code: true,
            isActive: true,
            maxUses: true,
            currentUses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drops);
  } catch (error) {
    console.error("Error fetching treasure drops:", error);
    return NextResponse.json(
      { error: "Failed to fetch treasure drops" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = treasureDropSchema.parse(body);

    // Check if treasure code already exists
    const existingCode = await prisma.treasureCode.findUnique({
      where: { code: validatedData.treasureCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Treasure code already exists" },
        { status: 400 }
      );
    }

    // Create treasure code first
    const treasureCode = await prisma.treasureCode.create({
      data: {
        code: validatedData.treasureCode,
        isActive: true,
        maxUses: 1,
        currentUses: 0,
      },
    });

    // Create treasure drop
    const drop = await prisma.treasureDrop.create({
      data: {
        name: validatedData.name,
        location: validatedData.location,
        radius: validatedData.radius,
        clue: validatedData.clue,
        reward: validatedData.reward,
        image: validatedData.image || null,
        status: "active",
        treasureCodeId: treasureCode.id,
      },
      include: {
        treasureCode: {
          select: {
            id: true,
            code: true,
            isActive: true,
            maxUses: true,
            currentUses: true,
          },
        },
      },
    });

    return NextResponse.json(drop, { status: 201 });
  } catch (error) {
    console.error("Error creating treasure drop:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create treasure drop" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Drop ID is required" },
        { status: 400 }
      );
    }

    // Validate the update data
    const validatedData = treasureDropSchema.partial().parse(updateData);

    // If treasure code is being updated, check if it already exists
    if (validatedData.treasureCode) {
      const existingCode = await prisma.treasureCode.findFirst({
        where: { 
          code: validatedData.treasureCode,
          id: { not: id }, // Exclude current drop's code
        },
      });

      if (existingCode) {
        return NextResponse.json(
          { error: "Treasure code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the drop
    const updatedDrop = await prisma.treasureDrop.update({
      where: { id },
      data: {
        name: validatedData.name,
        location: validatedData.location,
        radius: validatedData.radius,
        clue: validatedData.clue,
        reward: validatedData.reward,
        image: validatedData.image,
      },
      include: {
        treasureCode: {
          select: {
            id: true,
            code: true,
            isActive: true,
            maxUses: true,
            currentUses: true,
          },
        },
      },
    });

    return NextResponse.json(updatedDrop);
  } catch (error) {
    console.error("Error updating treasure drop:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update treasure drop" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Drop ID is required" },
        { status: 400 }
      );
    }

    // Delete the treasure drop (this will also delete the associated treasure code due to cascade)
    await prisma.treasureDrop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting treasure drop:", error);
    return NextResponse.json(
      { error: "Failed to delete treasure drop" },
      { status: 500 }
    );
  }
} 