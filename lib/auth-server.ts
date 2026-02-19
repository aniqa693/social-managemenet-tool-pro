import { betterAuth } from "better-auth";
import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
  try {
    const headersList = await headers();
    // You'll need to implement this based on your Better Auth setup
    // This is a simplified version - check Better Auth docs for proper server-side session handling
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session;
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}