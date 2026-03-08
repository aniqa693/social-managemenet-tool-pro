import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
//import { neonAdapter } from "@better-auth/neon";
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { db } from "../db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
//import { user } from "../auth-schema";
import { eq, sql } from "drizzle-orm";
import { customSession } from "better-auth/plugins";
import { account, session, subscription, user, verification } from "../db/schema";
//import { sendEmail } from './email'; // your email sending function

export type UserRole = 'creator' | 'analyst' | 'admin';
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
})
const PLANS = {
    basic: {
        priceId: "price_1T8J0i2K4OBpRWVxNYUmx09n",
        annualDiscountPriceId: "price_1234567890_annual",
        credits: 100,
        limits: {
            projects: 5,
            storage: 10
        }
    },
    pro: {
        priceId: "price_1T8J3M2K4OBpRWVxzjTr7zOQ",
        annualDiscountPriceId: "price_0987654321_annual",
        credits: 500,
        limits: {
            projects: 20,
            storage: 50
        }
    }
}

export const auth = betterAuth({
  //database: neonAdapter(db),
  database: drizzleAdapter(db, { 
    provider: "pg",
      schema: {
            user,
            account,
            session,
            verification,
            subscription // This is required!
        } // or "pg" or "mysql"
  }), 

  emailAndPassword: {
    enabled: true,
     
  },
    
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
  plugins: [nextCookies(), stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
            
            // Handle customer creation
            onCustomerCreate: async ({ stripeCustomer, user: authUser }, ctx) => {
                console.log(`Customer ${stripeCustomer.id} created for user ${authUser.id}`);
                
                // Update user record with stripeCustomerId
                await db
                    .update(user)
                    .set({ 
                        stripeCustomerId: stripeCustomer.id,
                        updatedAt: new Date()
                    })
                    .where(eq(user.id, authUser.id));
            },
            
            // Customize customer creation parameters
            getCustomerCreateParams: async (authUser, ctx) => {
                return {
                    metadata: {
                        userId: authUser.id,
                        email: authUser.email,
                        signupDate: new Date().toISOString()
                    }
                };
            },
            
            // IMPORTANT: Add metadata to subscription creation
            getSubscriptionCreateParams: async (authUser:any, priceId:any, ctx:any) => {
                return {
                    metadata: {
                        userId: authUser.id,
                        email: authUser.email,
                        plan: priceId.includes('basic') ? 'basic' : 'pro',
                        priceId: priceId
                    }
                };
            },
            
            // IMPORTANT: Add metadata to checkout session:
            getCheckoutSessionParams: async (authUser:any, priceId:any, ctx:any) => {
                return {
                    metadata: {
                        userId: authUser.id,
                        email: authUser.email,
                        priceId: priceId
                    },
                    client_reference_id: authUser.id, // This is also important!
                    payment_method_types: ['card'],
                    mode: 'subscription',
                    allow_promotion_codes: true,
                    billing_address_collection: 'auto',
                    tax_id_collection: {
                        enabled: true
                    }
                };
            },
            
            // Subscription configuration
            subscription: {
                enabled: true,
                plans: [
                    {
                        name: "basic",
                        priceId: PLANS.basic.priceId,
                        annualDiscountPriceId: PLANS.basic.annualDiscountPriceId,
                        limits: {
                            projects: 5,
                            storage: 10
                        }
                    },
                    {
                        name: "pro",
                        priceId: PLANS.pro.priceId,
                        annualDiscountPriceId: PLANS.pro.annualDiscountPriceId,
                        limits: {
                            projects: 20,
                            storage: 50
                        },
                        freeTrial: {
                            days: 14,
                        }
                    }
                ]
            }
        })],
// In your auth.ts - This is already set up

//    databaseHooks: {
//     user: {
//       create: {
//         before: async (user) => {
//           // Get role from user or default to creator
//           const role = (user.role as UserRole) || 'creator';
          
//           // Set credits based on role: 10 for creator, 0 for others
//           const credits = role === 'creator' ? 10 : 0;
          
//           console.log(`🎯 New user signup - Role: ${role}, Credits: ${credits}`);
          
//           // Return only the fields you want to modify
//           return {
//             data: {
//               credits: credits
//             }
//           };
//         }
//       }
//     }
//   },
 
});

export async function handleStripeWebhook(event: any) {
    console.log(`Processing webhook event: ${event.type}`, {
        id: event.id,
        type: event.type
    });

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const sessionData = event.data.object;
                console.log('Checkout session data:', {
                    id: sessionData.id,
                    metadata: sessionData.metadata,
                    client_reference_id: sessionData.client_reference_id,
                    customer: sessionData.customer,
                    subscription: sessionData.subscription
                });
                
                // Try multiple ways to get userId
                let userIdFromSession = sessionData.metadata?.userId || sessionData.client_reference_id;
                
                // If still no userId, try to get from customer
                if (!userIdFromSession && sessionData.customer) {
                    try {
                        const customer = await stripeClient.customers.retrieve(sessionData.customer);
                        if (!customer.deleted) {
                            userIdFromSession = customer.metadata?.userId;
                            console.log('Found userId in customer metadata:', userIdFromSession);
                        }
                    } catch (error) {
                        console.error('Error fetching customer:', error);
                    }
                }
                
                // Try to get priceId from multiple places
                let priceIdFromSession = sessionData.metadata?.priceId;
                
                if (!priceIdFromSession && sessionData.line_items?.data?.[0]?.price?.id) {
                    priceIdFromSession = sessionData.line_items.data[0].price.id;
                }
                
                if (!priceIdFromSession && sessionData.subscription) {
                    try {
                        const subscription = await stripeClient.subscriptions.retrieve(sessionData.subscription);
                        priceIdFromSession = subscription.items.data[0]?.price.id;
                        console.log('Found priceId from subscription:', priceIdFromSession);
                    } catch (error) {
                        console.error('Error fetching subscription:', error);
                    }
                }
                
                console.log('Extracted from checkout:', { userIdFromSession, priceIdFromSession });
                
                if (userIdFromSession && priceIdFromSession) {
                    await updateUserCredits(userIdFromSession, priceIdFromSession, 'checkout.session.completed');
                }
                break;
                
            case 'invoice.payment_succeeded':
                const invoiceData = event.data.object;
                console.log('Invoice data:', {
                    id: invoiceData.id,
                    subscription: invoiceData.subscription,
                    customer: invoiceData.customer,
                    metadata: invoiceData.metadata
                });
                
                if (invoiceData.subscription) {
                    const subscriptionData = await stripeClient.subscriptions.retrieve(invoiceData.subscription);
                    console.log('Subscription metadata:', subscriptionData.metadata);
                    
                    const userIdFromInvoice = subscriptionData.metadata?.userId || invoiceData.metadata?.userId;
                    const priceIdFromInvoice = subscriptionData.items.data[0]?.price.id;
                    
                    console.log('Extracted from invoice:', { userIdFromInvoice, priceIdFromInvoice });
                    
                    if (userIdFromInvoice && priceIdFromInvoice) {
                        await updateUserCredits(userIdFromInvoice, priceIdFromInvoice, 'invoice.payment_succeeded');
                    }
                }
                break;
                
            case 'customer.subscription.created':
                const newSubscriptionData = event.data.object;
                console.log('New subscription created:', {
                    id: newSubscriptionData.id,
                    metadata: newSubscriptionData.metadata,
                    customer: newSubscriptionData.customer,
                    status: newSubscriptionData.status
                });
                
                const userIdFromNewSub = newSubscriptionData.metadata?.userId;
                const priceIdFromNewSub = newSubscriptionData.items.data[0]?.price.id;
                
                if (userIdFromNewSub && priceIdFromNewSub && newSubscriptionData.status === 'active') {
                    await updateUserCredits(userIdFromNewSub, priceIdFromNewSub, 'subscription.created');
                }
                break;
                
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscriptionData = event.data.object;
                const userIdFromSubscription = subscriptionData.metadata?.userId;
                
                if (userIdFromSubscription && subscriptionData.status === 'canceled') {
                    await handleSubscriptionCancelled(userIdFromSubscription);
                }
                break;
        }
    } catch (error) {
        console.error(`Error processing ${event.type}:`, error);
    }
}

async function updateUserCredits(userId: string, priceId: string, source: string) {
    console.log(`[${source}] Updating credits for user ${userId} with priceId ${priceId}`);
    
    // First check if user exists
    try {
        const userExists = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);
        
        if (userExists.length === 0) {
            console.error(`❌ User ${userId} not found in database!`);
            return;
        }
    } catch (error) {
        console.error('Error checking user existence:', error);
        return;
    }
    
    // Determine credits based on price ID
    let creditsToAdd = 0;
    let planType = '';
    
    console.log('Comparing price IDs:', {
        received: priceId,
        basic_monthly: PLANS.basic.priceId,
        basic_annual: PLANS.basic.annualDiscountPriceId,
        pro_monthly: PLANS.pro.priceId,
        pro_annual: PLANS.pro.annualDiscountPriceId
    });
    
    if (priceId === PLANS.basic.priceId) {
        creditsToAdd = PLANS.basic.credits;
        planType = 'basic monthly';
    } else if (priceId === PLANS.basic.annualDiscountPriceId) {
        creditsToAdd = PLANS.basic.credits * 12; // Add all credits for the year
        planType = 'basic annual';
    } else if (priceId === PLANS.pro.priceId) {
        creditsToAdd = PLANS.pro.credits;
        planType = 'pro monthly';
    } else if (priceId === PLANS.pro.annualDiscountPriceId) {
        creditsToAdd = PLANS.pro.credits * 12; // Add all credits for the year
        planType = 'pro annual';
    } else {
        console.log(`❌ No matching plan for priceId: ${priceId}`);
        return;
    }
    
    if (creditsToAdd > 0) {
        try {
            // Get current credits first
            const currentUser = await db
                .select({ credits: user.credits })
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);
            
            console.log(`Current credits for user ${userId}:`, currentUser[0]?.credits);
            
            // Update credits
            const result = await db
                .update(user)
                .set({ 
                    credits: sql`${user.credits} + ${creditsToAdd}`,
                    updatedAt: new Date()
                })
                .where(eq(user.id, userId))
                .returning({ 
                    id: user.id, 
                    credits: user.credits 
                });
            
            console.log(`✅ [${source}] Added ${creditsToAdd} credits (${planType}) to user ${userId}`);
            console.log(`New credit balance:`, result[0]?.credits);
        } catch (error) {
            console.error(`❌ Error updating credits for user ${userId}:`, error);
        }
    }
}

async function handleSubscriptionCancelled(userId: string) {
    console.log(`Subscription cancelled for user ${userId}`);
    // Add any cancellation logic here
}

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
