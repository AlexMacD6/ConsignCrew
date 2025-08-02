"use server";

import { auth } from "../../lib/auth";
import { headers } from "next/headers";

export type RegistrationData = {
  email: string;
  password: string;
  name: string;
  mobilePhone?: string;
};

export async function registerUser(data: RegistrationData) {
  try {
    console.log('=== REGISTRATION START ===');
    console.log('registerUser called with data:', data);
    
    // 1. Validate input
    if (!data.email || !data.password || !data.name) {
      console.log('Validation failed: missing required fields');
      return { success: false, error: "All fields are required." };
    }
    if (data.password.length < 8) {
      console.log('Validation failed: password too short');
      return { success: false, error: "Password must be at least 8 characters." };
    }
    console.log('Input validation passed');

    // 2. Prepare registration data for Better Auth
    const userData = {
      name: data.name.trim(), // Primary name field
      email: data.email,
      password: data.password, // This will be handled by Better Auth and stored on the account
      mobilePhone: data.mobilePhone,
    };

    console.log('registerUser - Input data:', data);
    console.log('registerUser - UserData being sent to BetterAuth:', userData);

    // 3. Call Better Auth's signUpEmail API
    const headersList = await headers();
    console.log('registerUser - Calling BetterAuth signUpEmail with headers:', Object.fromEntries(headersList.entries()));
    console.log('registerUser - User data being sent:', userData);
    
    const result = await auth.api.signUpEmail({
      body: userData,
      headers: headersList,
    });
    
    console.log('registerUser - BetterAuth signUpEmail result:', {
      success: !!result,
      userId: result?.user?.id,
      email: result?.user?.email,
      emailVerified: result?.user?.emailVerified,
      userObject: result?.user,
    });
    
    // Check if email verification was triggered
    if (result?.user && !result.user.emailVerified) {
      console.log('registerUser - User created but email not verified. Manually triggering email verification...');
      
      try {
        // Manually send verification email using SES
        console.log('registerUser - Manually sending verification email via SES...');
        
        const { sendEmail } = await import('../../lib/ses-server');
        
        // Generate verification URL (this should match BetterAuth's format)
        const verificationUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${result.user.id}`;
        
        const subject = 'Verify your TreasureHub account';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #D4AF3D; margin: 0;">TreasureHub</h1>
              <p style="color: #666; margin: 10px 0;">Verify your email address</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Welcome to TreasureHub!</h2>
              <p style="color: #555; line-height: 1.6;">
                Hi ${result.user.name},
              </p>
              <p style="color: #555; line-height: 1.6;">
                Thank you for signing up for TreasureHub! To complete your registration, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #D4AF3D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">
                ${verificationUrl}
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>This email was sent to verify your TreasureHub account.</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        `;
        
        const emailResult = await sendEmail(result.user.email, subject, html);
        console.log('registerUser - SES email sent successfully:', emailResult);
        
      } catch (verificationError) {
        console.error('registerUser - Error sending verification email via SES:', verificationError);
      }
    }

    console.log('=== REGISTRATION SUCCESS ===');
    console.log('Final result:', {
      success: true,
      userId: result.user.id,
      email: result.user.email,
      emailVerified: result.user.emailVerified,
    });

    return {
      success: true,
      userId: result.user.id,
      email: result.user.email,
    };
  } catch (error: any) {
    console.error("=== REGISTRATION ERROR ===");
    console.error("Registration error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
} 