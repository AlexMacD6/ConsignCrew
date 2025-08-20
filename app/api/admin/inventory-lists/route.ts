import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const lists = await prisma.inventoryList.findMany({
      orderBy: { createdAt: "desc" },
      select: { 
        id: true, 
        name: true, 
        createdAt: true, 
        winningBidAmount: true,
        serviceCharges: true,
        shippingCharges: true,
        totalPurchasePrice: true,
        totalExtRetailValue: true,
        msrpPercentage: true,
        _count: { select: { items: true } },
        items: {
          select: {
            quantity: true
          }
        }
      },
    });

    // Calculate total units for each list and add it to the response
    const listsWithTotalUnits = lists.map(list => {
      const totalUnits = list.items.reduce((sum, item) => {
        return sum + (item.quantity || 0);
      }, 0);

      // Remove the items array from the response and add totalUnits
      const { items, ...listWithoutItems } = list;
      return {
        ...listWithoutItems,
        totalUnits
      };
    });

    return NextResponse.json({ success: true, lists: listsWithTotalUnits });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const list = await prisma.inventoryList.create({
      data: { name, createdBy: session.user.id },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}


