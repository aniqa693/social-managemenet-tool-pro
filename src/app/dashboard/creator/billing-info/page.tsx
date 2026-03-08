'use client';

import { authClient } from '../../../../../lib/auth-client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
    id: string;
    plan: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused' | 'unpaid';
    periodStart: string;
    periodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialStart?: string;
    trialEnd?: string;
    priceId?: string;
    seats?: number;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}

export default function BillingPage() {
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);
    const [userCredits, setUserCredits] = useState<number>(0);
    
    const { data: session, isPending: sessionLoading } = authClient.useSession();

    useEffect(() => {
        if (!sessionLoading && !session) {
            router.push('/sign-in?redirect=/dashboard/billing');
            return;
        }
        
        if (session?.user) {
            fetchUserData();
        }
    }, [session, sessionLoading]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Get user credits from your user object
            if (session?.user) {
                // You might need to fetch user details including credits
                // This depends on your setup
                setUserCredits((session.user as any).credit || 0);
            }

            // Try to get subscriptions - this might need adjustment based on your actual API
            try {
                // Method 1: If you have a direct API for subscriptions
                const { data, error } = await authClient.subscription.list();
                
                if (error) {
                    console.error('Error fetching subscriptions:', error);
                } else if (data) {
                    // Transform the data to match our Subscription interface
                    const formattedSubs = (Array.isArray(data) ? data : []).map((sub: any) => ({
                        id: sub.id || sub.stripeSubscriptionId || '',
                        plan: sub.plan || (sub.priceId?.includes('basic') ? 'basic' : 'pro'),
                        status: sub.status || 'active',
                        periodStart: sub.periodStart ? new Date(sub.periodStart).toISOString() : new Date().toISOString(),
                        periodEnd: sub.periodEnd ? new Date(sub.periodEnd).toISOString() : new Date().toISOString(),
                        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
                        trialStart: sub.trialStart ? new Date(sub.trialStart).toISOString() : undefined,
                        trialEnd: sub.trialEnd ? new Date(sub.trialEnd).toISOString() : undefined,
                        priceId: sub.priceId,
                        seats: sub.seats,
                        stripeCustomerId: sub.stripeCustomerId,
                        stripeSubscriptionId: sub.stripeSubscriptionId
                    }));
                    
                    setSubscriptions(formattedSubs);
                }
            } catch (subError) {
                console.log('No subscriptions found or error fetching:', subError);
                setSubscriptions([]);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openBillingPortal = async () => {
        setPortalLoading(true);
        try {
            // Method 1: Use the built-in billing portal method
            const { data, error } = await authClient.subscription.billingPortal({
                returnUrl: `${window.location.origin}/dashboard/creator/billing-info`,
                locale: 'auto'
            });

            if (error) {
                console.error('Error opening billing portal:', error);
                // Fallback to manual portal creation
                await openBillingPortalFallback();
            } else if (data?.url) {
                window.location.href = data.url;
            } else {
                // Try fallback method
                await openBillingPortalFallback();
            }
        } catch (error) {
            console.error('Error:', error);
            // Try fallback method
            await openBillingPortalFallback();
        } finally {
            setPortalLoading(false);
        }
    };

    // Fallback method using your custom API endpoint
    const openBillingPortalFallback = async () => {
        try {
            const response = await fetch('/api/billing/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Failed to open billing portal. Please try again later.');
            }
        } catch (error) {
            console.error('Fallback portal error:', error);
            alert('An error occurred while opening the billing portal');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (subscription: Subscription) => {
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
        
        if (status === 'active' && cancelAtPeriodEnd) {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Cancels on {formatDate(subscription.periodEnd)}
                </span>
            );
        }
        
        switch (status) {
            case 'active':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                    </span>
                );
            case 'trialing':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Trial {subscription.trialEnd ? `(ends ${formatDate(subscription.trialEnd)})` : ''}
                    </span>
                );
            case 'past_due':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Past Due
                    </span>
                );
            case 'canceled':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Canceled
                    </span>
                );
            case 'incomplete':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        Incomplete
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    if (sessionLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading billing information...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your subscription and billing information
                    </p>
                </div>

                {/* Credits Display */}
                {userCredits > 0 && (
                    <div className="mb-6 bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Credits</h2>
                        <p className="text-3xl font-bold text-blue-600">{userCredits}</p>
                        <p className="text-sm text-gray-500 mt-1">Available credits for usage</p>
                    </div>
                )}

                {subscriptions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            No Active Subscription
                        </h2>
                        <p className="text-gray-600 mb-6">
                            You don't have any active subscriptions. Choose a plan to get started.
                        </p>
                        <button
                            onClick={() => router.push('/pricing')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            View Plans
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                            {sub.plan} Plan
                                        </h2>
                                        {getStatusBadge(sub)}
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4">
                                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900 capitalize">
                                                {sub.status}
                                            </dd>
                                        </div>
                                        
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Current Period</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {formatDate(sub.periodStart)} - {formatDate(sub.periodEnd)}
                                            </dd>
                                        </div>
                                        
                                        {sub.trialStart && sub.trialEnd && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Trial Period</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {formatDate(sub.trialStart)} - {formatDate(sub.trialEnd)}
                                                </dd>
                                            </div>
                                        )}
                                        
                                        {sub.seats && (
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Seats</dt>
                                                <dd className="mt-1 text-sm text-gray-900">{sub.seats}</dd>
                                            </div>
                                        )}
                                        
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Subscription ID</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">
                                                {sub.id}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        ))}

                        {/* Billing Portal Button */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Manage Billing
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Update your payment method, view invoices, or change your subscription plan.
                            </p>
                            <button
                                onClick={openBillingPortal}
                                disabled={portalLoading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {portalLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Opening Portal...
                                    </span>
                                ) : 'Open Billing Portal'}
                            </button>
                        </div>

                        {/* Invoice History Note */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Invoices
                            </h3>
                            <p className="text-gray-600">
                                View and download your complete invoice history in the Stripe billing portal.
                                Click the "Open Billing Portal" button above to access all invoices.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}