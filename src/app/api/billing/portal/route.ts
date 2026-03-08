import { NextResponse } from 'next/server';
import { auth } from '../../../../../lib/auth';
import { headers } from 'next/headers';

export async function POST() {
    try {
        const headersList = await headers();
        
        // Get the current session
        const session = await auth.api.getSession({
            headers: headersList
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Create a billing portal session
        const portalSession = await auth.api.createBillingPortal({
            headers: headersList,
            body: {
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/creator/billing-info`,
                locale: 'auto'
            }
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error('Billing portal error:', error);
        return NextResponse.json(
            { error: 'Failed to create billing portal session' },
            { status: 500 }
        );
    }
}