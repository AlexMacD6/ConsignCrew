import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log('Profile API: Request received');
    
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });
    console.log('Profile API: Session retrieved');
    
    if (!session?.user?.id) {
      console.log('Profile API: No valid session found');
      return NextResponse.json({ 
        success: false,
        error: "Not authenticated",
        message: "Please log in to access your profile"
      }, { status: 401 });
    }

    console.log('Profile API: Session found for user');

    // Fetch user from DB
    console.log('Profile API: Fetching user from database');
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobilePhone: true,
        emailVerified: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        // userType field removed - using organization-based permissions instead
        createdAt: true,
        updatedAt: true,
      }
    });
    
    console.log('Profile API: User query completed');

    if (!user) {
      console.log('Profile API: User not found in database');
      return NextResponse.json({ 
        success: false,
        error: "User not found",
        message: "User account not found in database"
      }, { status: 404 });
    }

    console.log('Profile API: Successfully fetched user profile');
    return NextResponse.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Profile API: Error fetching user profile:', error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Failed to fetch user profile",
      details: error instanceof Error ? error.stack : undefined
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
        success: false,
        error: "Not authenticated",
        message: "Please log in to update your profile"
      }, { status: 401 });
    }

    const body = await req.json();
    console.log('Profile API: Updating user profile');

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        mobilePhone: body.mobilePhone,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobilePhone: true,
        emailVerified: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,

        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('Profile API: Successfully updated user profile');
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile API: Error updating user profile:', error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Failed to update user profile",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 