import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, mobilePhone } = await req.json();
    if (!firstName || !lastName || !email || !mobilePhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    // Create user (password and other fields omitted for now)
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        mobilePhone,
        passwordHash: "", // Placeholder
        preferredContact: "email",
        shippingAddress: "",
        payoutMethod: "",
        payoutAccount: "",
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 