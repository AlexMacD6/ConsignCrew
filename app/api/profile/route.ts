import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      console.log('Profile API: No valid session found');
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please log in to access your profile"
      }, { status: 401 });
    }

    console.log('Profile API: Session found for user:', session.user.id);

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobilePhone: true,
        preferredContact: true,
        shippingAddress: true,
        alternatePickup: true,
        payoutMethod: true,
        payoutAccount: true,
        profilePhotoUrl: true,
        governmentIdUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      console.log('Profile API: User not found in database:', session.user.id);
      return NextResponse.json({ 
        error: "User not found",
        message: "User account not found in database"
      }, { status: 404 });
    }

    console.log('Profile API: Successfully fetched user profile');
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile API: Error fetching user profile:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to fetch user profile"
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      console.log('Profile API: No valid session found for update');
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please log in to update your profile"
      }, { status: 401 });
    }

    const body = await req.json();
    console.log('Profile API: Updating user profile:', session.user.id, body);

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        mobilePhone: body.mobilePhone,
        preferredContact: body.preferredContact,
        shippingAddress: body.shippingAddress,
        alternatePickup: body.alternatePickup,
        payoutMethod: body.payoutMethod,
        payoutAccount: body.payoutAccount,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobilePhone: true,
        preferredContact: true,
        shippingAddress: true,
        alternatePickup: true,
        payoutMethod: true,
        payoutAccount: true,
        profilePhotoUrl: true,
        governmentIdUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('Profile API: Successfully updated user profile');
    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile API: Error updating user profile:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to update user profile"
    }, { status: 500 });
  }
} 