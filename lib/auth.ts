import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
//import { neonAdapter } from "@better-auth/neon";
import { db } from "../db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
export type UserRole = 'creator' | 'analyst' | 'admin';


export const auth = betterAuth({
  //database: neonAdapter(db),
  database: drizzleAdapter(db, { 
    provider: "pg", // or "pg" or "mysql"
  }), 
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(url, user) {
      // Implement email sending logic here
      console.log(`Reset password URL: ${url}`);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "creator",
        input: true, // Allow input during signup
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
