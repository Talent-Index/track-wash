import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoPaymentRequest {
  bookingId: string;
  txHash: string;
  walletAddress: string;
  chainId: number;
  tokenSymbol: string;
  amountUsd: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, txHash, walletAddress, chainId, tokenSymbol, amountUsd } = 
      await req.json() as CryptoPaymentRequest;

    console.log("Crypto payment confirmation:", { bookingId, txHash, chainId, tokenSymbol });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store payment record
    const { error: insertError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount_usd: amountUsd,
        payment_method: "crypto",
        status: "completed",
        tx_hash: txHash,
        wallet_address: walletAddress,
        chain_id: chainId,
        token_symbol: tokenSymbol,
        paid_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to store payment:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update booking status
    await supabase
      .from("bookings")
      .update({ status: "paid" })
      .eq("id", bookingId);

    // Log activity
    await supabase
      .from("booking_activity_logs")
      .insert({
        booking_id: bookingId,
        action: "payment_confirmed",
        details: {
          method: "crypto",
          txHash,
          chainId,
          tokenSymbol,
          amountUsd,
        },
      });

    // Trigger notification
    const notifyUrl = `${supabaseUrl}/functions/v1/send-notification`;
    await fetch(notifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        type: "payment_confirmed",
        bookingId,
        data: {
          txHash,
          amountUsd,
        },
      }),
    });

    return new Response(
      JSON.stringify({ success: true, txHash }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Crypto payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
