import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
//import { neonAdapter } from "@better-auth/neon";
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { db } from "../db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { user } from "../auth-schema";
import { eq } from "drizzle-orm";
import { customSession } from "better-auth/plugins";
//import { sendEmail } from './email'; // your email sending function

export type UserRole = 'creator' | 'analyst' | 'admin';

// const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//     apiVersion: "2026-02-25.clover", // Latest API version as of Stripe SDK v20.0.0
// })

export const auth = betterAuth({
  //database: neonAdapter(db),
  database: drizzleAdapter(db, { 
    provider: "pg", // or "pg" or "mysql"
  }), 

  emailAndPassword: {
    enabled: true,
       // requireEmailVerification: true

    // async sendResetPassword(url, user) {
    //   // Implement email sending logic here
    //   console.log(`Reset password URL: ${url}`);
    // },
  },
    // emailVerification: {
    //     sendOnSignUp: true
    // },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "creator",
        input: true, // Allow input during signup
      },
       credits: {
        type: "number",
        defaultValue: 0,
        required: false,
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
// In your auth.ts - This is already set up

   databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Get role from user or default to creator
          const role = (user.role as UserRole) || 'creator';
          
          // Set credits based on role: 10 for creator, 0 for others
          const credits = role === 'creator' ? 10 : 0;
          
          console.log(`🎯 New user signup - Role: ${role}, Credits: ${credits}`);
          
          // Return only the fields you want to modify
          return {
            data: {
              credits: credits
            }
          };
        }
      }
    }
  },
 
});



export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
