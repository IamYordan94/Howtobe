/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-02-25.clover",
});

export async function POST() {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            customer_email: session.user.email,
            metadata: {
                userId: session.user.id,
            },
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: "How To Be Human — Complete Access",
                            description: "Lifetime access to all 50 subjects and lessons.",
                        },
                        unit_amount: 2900,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unlock`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error("Checkout error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
