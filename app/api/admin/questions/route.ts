import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/questions
 * Fetch all questions for admin dashboard with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected
    const search = searchParams.get("search"); // search by question text or listing
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (status) {
      switch (status) {
        case "pending":
          whereClause.isApproved = false;
          break;
        case "approved":
          whereClause.isApproved = true;
          whereClause.isPublic = true;
          break;
        case "rejected":
          whereClause.isApproved = false;
          whereClause.answer = { not: null };
          break;
      }
    }

    if (search) {
      whereClause.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { listingId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch questions with related data
    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answeredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
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
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.question.count({
      where: whereClause,
    });

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/questions
 * Update question approval status and/or add answer
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, isApproved, isPublic, answer, answeredById } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(isApproved !== undefined && { isApproved }),
        ...(isPublic !== undefined && { isPublic }),
        ...(answer && {
          answer,
          answeredById,
          answeredAt: new Date(),
        }),
        ...(isApproved !== undefined && {
          approvedById: answeredById,
          approvedAt: new Date(),
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        answeredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/questions
 * Delete a question (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("id");

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
} 