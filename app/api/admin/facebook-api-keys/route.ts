import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

// Validation schema for API key creation
const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  createdBy: z.string().min(1, "User ID is required"),
});

// Validation schema for API key updates
const updateApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    const apiKeys = await prisma.facebookApiKey.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        isActive: true,
        lastUsed: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching Facebook API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Generate a secure API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Create the API key record
    const newApiKey = await prisma.facebookApiKey.create({
      data: {
        name: validatedData.name,
        apiKey: apiKey,
        isActive: true,
        createdBy: validatedData.createdBy,
      },
    });

    // Return the full key only on creation
    return NextResponse.json({
      ...newApiKey,
      apiKey: apiKey // Include the actual key in response
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating Facebook API key:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create API key" },
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
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Validate the update data
    const validatedData = updateApiKeySchema.parse(updateData);

    // Update the API key
    const updatedApiKey = await prisma.facebookApiKey.update({
      where: { id },
      data: {
        name: validatedData.name,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(updatedApiKey);
  } catch (error) {
    console.error("Error updating Facebook API key:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update API key" },
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
        { error: "API key ID is required" },
        { status: 400 }
      );
    }

    // Delete the API key
    await prisma.facebookApiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Facebook API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
} 