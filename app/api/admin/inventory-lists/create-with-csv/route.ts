import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Parse CSV content and extract inventory items
 * This uses the same parsing logic as the existing upload endpoint
 */
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
      category: get(col.category),
    };
  });
}

/**
 * POST endpoint to create an inventory list and upload CSV data in one step
 * Expects multipart form data with:
 * - name: string (inventory list name)
 * - file: File (CSV file - optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const lotNumber = formData.get("lotNumber") as string || "";
    const datePurchased = formData.get("datePurchased") as string || "";
    const briefDescription = formData.get("briefDescription") as string || "";
    const file = formData.get("file") as File | null;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    // Create the inventory list first
    const inventoryList = await prisma.inventoryList.create({
      data: { 
        name: name.trim(), 
        lotNumber: lotNumber.trim() || null,
        datePurchased: datePurchased ? new Date(datePurchased) : null,
        briefDescription: briefDescription.trim() || null,
        createdBy: session.user.id 
      },
      select: { 
        id: true, 
        name: true, 
        lotNumber: true,
        datePurchased: true,
        briefDescription: true,
        createdAt: true 
      },
    });

    let uploadResult = { itemCount: 0, hasFile: false };

    // If a CSV file was provided, process it
    if (file && file.size > 0) {
      try {
        const text = await file.text();
        const rows = parseCsv(text).filter((r) => r.itemNumber);

        if (rows.length > 0) {
          // Process rows to calculate extRetail if not provided
          const processedRows = rows.map(row => ({
            ...row,
            listId: inventoryList.id,
            // Calculate extRetail if not provided
            extRetail: row.extRetail || (row.unitRetail && row.quantity ? row.unitRetail * row.quantity : null)
          }));

          // Chunk inserts for large files
          const chunkSize = 500;
          for (let i = 0; i < processedRows.length; i += chunkSize) {
            const chunk = processedRows.slice(i, i + chunkSize);
            await prisma.inventoryItem.createMany({ 
              data: chunk, 
              skipDuplicates: true 
            });
          }

          uploadResult = {
            itemCount: processedRows.length,
            hasFile: true
          };
        } else {
          uploadResult = {
            itemCount: 0,
            hasFile: true
          };
        }
      } catch (csvError) {
        // If CSV processing fails, we still keep the created list
        // but return an error about the CSV
        console.error("CSV processing failed:", csvError);
        return NextResponse.json({
          success: true,
          inventoryList,
          uploadResult: { itemCount: 0, hasFile: true },
          warning: "Inventory list created successfully, but CSV processing failed. Please check your CSV format and try uploading again."
        });
      }
    }

    return NextResponse.json({
      success: true,
      inventoryList,
      uploadResult,
      message: uploadResult.hasFile 
        ? `Inventory list "${name}" created successfully with ${uploadResult.itemCount} items imported from CSV.`
        : `Inventory list "${name}" created successfully. You can upload CSV data later.`
    });

  } catch (error) {
    console.error("Failed to create inventory list with CSV:", error);
    return NextResponse.json({ 
      error: "Failed to create inventory list",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
