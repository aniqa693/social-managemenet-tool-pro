// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { handleStripeWebhook } from '../../../../../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error(`Webhook signature verification failed:`, err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        await handleStripeWebhook(event);
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}