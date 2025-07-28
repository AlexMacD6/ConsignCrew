import { NextRequest, NextResponse } from "next/server";
import { db, safeDbOperation } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, mobilePhone } = await req.json();
    if (!firstName || !lastName || !email || !mobilePhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Safely execute database operations
    const existing = await safeDbOperation(async () => {
      return await db.user.findUnique({ where: { email } });
    });

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    
    // Create user (password and other fields omitted for now)
    await safeDbOperation(async () => {
      return await db.user.create({
        data: {
          firstName,
          lastName,
          email,
          mobilePhone,
        },
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 