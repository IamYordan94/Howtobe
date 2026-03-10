/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
            const { error } = await supabaseAdmin
                .from("users")
                .update({ has_access: true, payment_date: new Date().toISOString() })
                .eq("id", userId);

            if (error) {
                console.error("Error updating user access:", error);
            }
        }
    }

    return NextResponse.json({ received: true });
}
