import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, mobilePhone } = await req.json();
    if (!firstName || !lastName || !email || !mobilePhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Combine firstName and lastName into name field
    const name = `${firstName} ${lastName}`.trim();
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    
    // Create user with name field instead of firstName/lastName
    await prisma.user.create({
      data: {
        name,
        email,
        mobilePhone,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 