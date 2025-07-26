import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");
    const isAdmin = searchParams.get("isAdmin") === "true";

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Fetch questions for the listing
    const questions = await prisma.question.findMany({
      where: {
        listingId: listingId,
        // Only show public questions to non-admins
        ...(isAdmin ? {} : { isPublic: true }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        answeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, question, createdBy } = body;

    if (!listingId || !question || !createdBy) {
      return NextResponse.json(
        { error: "Listing ID, question, and user ID are required" },
        { status: 400 }
      );
    }

    const newQuestion = await prisma.question.create({
      data: {
        listingId,
        question,
        createdBy,
        isApproved: false,
        isPublic: false,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
} 