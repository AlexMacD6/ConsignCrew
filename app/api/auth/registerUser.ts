"use server";

import { auth } from "../../lib/auth";
import { headers } from "next/headers";

export type RegistrationData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
};

export async function registerUser(data: RegistrationData) {
  try {
    // 1. Validate input
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return { success: false, error: "All fields are required." };
    }
    if (data.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }
    // Add more validation as needed

    // 2. Prepare registration data for Better Auth
    const userData = {
      name: `${data.firstName} ${data.lastName}`.trim(), // Required by BetterAuth
      email: data.email,
      password: data.password, // This will be handled by Better Auth and stored on the account
      firstName: data.firstName,
      lastName: data.lastName,
      mobilePhone: data.mobilePhone,
    };

    // 3. Call Better Auth's signUpEmail API
    const headersList = await headers();
    const result = await auth.api.signUpEmail({
      body: userData,
      headers: headersList,
    });

    return {
      success: true,
      userId: result.user.id,
      email: result.user.email,
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error.message || "Registration failed",
    };
  }
} 