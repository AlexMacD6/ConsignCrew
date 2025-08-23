import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = params.id;
    const body = await request.json();
    const notes = (body?.notes ?? "").toString();

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { notes },
      select: { id: true, notes: true },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error updating inventory item notes:", error);
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 }
    );
  }
}
