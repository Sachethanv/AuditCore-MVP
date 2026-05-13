'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    setLoading(plan);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for trying it out.',
      features: [
        '1 event',
        'Up to 20 teams',
        'Up to 3 judges',
        'Basic AI analysis',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Pro',
      price: '$99',
      subtext: 'per event',
      description: 'Everything you need for a professional hackathon.',
      features: [
        'Unlimited teams',
        'Unlimited judges',
        'Full AI analysis',
        'CSV export',
        'Email support',
      ],
      buttonText: 'Buy Now',
      buttonVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'Org',
      price: '$299',
      subtext: 'per month',
      description: 'For organizations running multiple events.',
      features: [
        'Unlimited events',
        'Multi-event dashboard',
        'Historical analytics',
        'Priority support',
        'API access',
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'outline' as const,
    },
  ];

  return (
    <div className="container py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-500">Choose the plan that fits your event.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.subtext && <span className="text-gray-500">{plan.subtext}</span>}
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.buttonVariant}
                onClick={() => plan.name !== 'Free' && handleUpgrade(plan.name)}
                disabled={loading === plan.name}
              >
                {loading === plan.name ? 'Loading...' : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
