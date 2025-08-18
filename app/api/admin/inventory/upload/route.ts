import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [] as any[];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h.startsWith(name));
  const col = {
    lot: idx("lot"),
    item: idx("item"),
    deptCode: idx("dept"),
    department: idx("department"),
    desc: idx("item desc"),
    qty: idx("qty"),
    unitRetail: idx("unit retail"),
    extRetail: idx("ext. retail"),
    vendor: idx("vendor"),
    categoryCode: idx("category c"),
    category: idx("category"),
  };
  return lines.slice(1).map((line) => {
    const v = line.split(",");
    const get = (i: number) => (i >= 0 ? v[i]?.trim() ?? null : null);
    return {
      lotNumber: get(col.lot),
      itemNumber: get(col.item),
      deptCode: get(col.deptCode),
      department: get(col.department),
      description: get(col.desc),
      quantity: get(col.qty) ? Number(get(col.qty)) : null,
      unitRetail: get(col.unitRetail) ? Number(get(col.unitRetail)) : null,
      extRetail: get(col.extRetail) ? Number(get(col.extRetail)) : null,
      vendor: get(col.vendor),
      categoryCode: get(col.categoryCode),
      category: get(col.category),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const listId = form.get("listId") as string;
    
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (!listId) return NextResponse.json({ error: "listId is required" }, { status: 400 });

    // Verify the list exists and belongs to the user
    const existingList = await prisma.inventoryList.findFirst({
      where: { id: listId, createdBy: session.user.id }
    });
    
    if (!existingList) {
      return NextResponse.json({ error: "Inventory list not found or access denied" }, { status: 404 });
    }

    const text = await file.text();
    const rows = parseCsv(text).filter((r) => r.itemNumber);

    if (rows.length > 0) {
      // Process rows to calculate extRetail if not provided
      const processedRows = rows.map(row => ({
        ...row,
        listId,
        // Calculate extRetail if not provided
        extRetail: row.extRetail || (row.unitRetail && row.quantity ? row.unitRetail * row.quantity : null)
      }));

      // Chunk inserts for large files
      const chunkSize = 500;
      for (let i = 0; i < processedRows.length; i += chunkSize) {
        const chunk = processedRows.slice(i, i + chunkSize);
        await prisma.inventoryItem.createMany({ data: chunk, skipDuplicates: true });
      }
    }

    return NextResponse.json({ success: true, listId, count: rows.length });
  } catch (error) {
    console.error("CSV upload failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}


