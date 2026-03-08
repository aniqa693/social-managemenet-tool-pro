// app/pricing/page.tsx
'use client';

import { authClient } from '../../../../../lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const plans = [
    {
        name: 'Basic',
        id: 'basic',
        price: '$10',
        interval: 'month',
        credits: 100,
        features: [
            '100 credits per month',
            '5 projects',
            '10GB storage',
            'Basic support'
        ],
        hasTrial: false
    },
    {
        name: 'Pro',
        id: 'pro',
        price: '$30',
        interval: 'month',
        credits: 500,
        features: [
            '500 credits per month',
            '20 projects',
            '50GB storage',
            'Priority support',
            'Advanced analytics',
            '14-day free trial'
        ],
        hasTrial: true
    }
];

export default function PricingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

    const handleSubscribe = async (plan: typeof plans[0]) => {
        setLoading(plan.id);
        
        try {
            // The priceId is handled by the server based on the plan name and annual flag
            const { data, error } = await authClient.subscription.upgrade({
                plan: plan.id,
                annual: billingCycle === 'year',
                successUrl: `${window.location.origin}/dashboard/creator?success=true`,
                cancelUrl: `${window.location.origin}/dashboard/creator/billing?canceled=true`,
            });

            if (error) {
                console.error('Subscription error:', error);
                alert(error.message || 'Failed to start subscription');
            } else if (data?.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                // If no URL is returned but no error, maybe redirect to success page
                console.log('Subscription initiated:', data);
                router.push('/dashboard?success=true');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred');
        } finally {
            setLoading(null);
        }
    };

    // Calculate yearly price (20% discount)
    const getYearlyPrice = (monthlyPrice: string) => {
        const monthly = parseInt(monthlyPrice.replace('$', ''));
        const yearly = monthly * 12 * 0.8; // 20% discount
        return `$${Math.round(yearly)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Choose the plan that's right for you
                    </p>
                    
                    {/* Billing toggle */}
                    <div className="flex justify-center items-center space-x-4 mb-12">
                        <button
                            onClick={() => setBillingCycle('month')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                billingCycle === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('year')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                billingCycle === 'year'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Yearly (Save 20%)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            <div className="px-6 py-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.name}
                                </h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold">
                                        {billingCycle === 'year' 
                                            ? getYearlyPrice(plan.price)
                                            : plan.price}
                                    </span>
                                    <span className="text-gray-600">
                                        /{billingCycle === 'year' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-6">
                                    {plan.credits} credits {billingCycle === 'year' ? 'per year' : 'per month'}
                                </p>
                                {plan.hasTrial && billingCycle === 'month' && (
                                    <p className="text-green-600 text-sm mb-4">
                                        Includes 14-day free trial
                                    </p>
                                )}
                                {billingCycle === 'year' && (
                                    <p className="text-green-600 text-sm mb-4">
                                        Save 20% with annual billing
                                    </p>
                                )}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <svg
                                                className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={loading === plan.id}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {loading === plan.id
                                        ? 'Processing...'
                                        : `Subscribe to ${plan.name}`}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}