import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  });

  try {
    const { plan } = await req.json();

    // Simplified: in a real app you'd get the orgId from the session/user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // For demo purposes, we'll just use a placeholder orgId if we can't find one
    let { data: orgs } = await supabase.from('organisations').select('id').limit(1);
    const orgId = orgs?.[0]?.id || 'placeholder-org-id';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan === 'Pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_ORG_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: plan === 'Pro' ? 'payment' : 'subscription',
      success_url: `${new URL(req.url).origin}/dashboard?success=true`,
      cancel_url: `${new URL(req.url).origin}/pricing`,
      metadata: {
        orgId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
