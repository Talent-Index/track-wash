import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface STKPushRequest {
  phone: string;
  amount: number;
  bookingId: string;
  accountReference?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, bookingId, accountReference } = await req.json() as STKPushRequest;

    console.log("M-Pesa STK Push request:", { phone, amount, bookingId });

    // Validate phone number (Kenyan format)
    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    const match = phone.match(phoneRegex);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use 254XXXXXXXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const formattedPhone = "254" + match[1];

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");

    if (!consumerKey || !consumerSecret || !passkey || !shortcode || !callbackUrl) {
      console.error("Missing M-Pesa credentials");
      return new Response(
        JSON.stringify({ error: "M-Pesa configuration incomplete" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine environment (sandbox or production)
    const isSandbox = consumerKey.length < 50; // Sandbox keys are shorter
    const baseUrl = isSandbox 
      ? "https://sandbox.safaricom.co.ke" 
      : "https://api.safaricom.co.ke";

    // Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authString}`,
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("OAuth token error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // STK Push request
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || `TW-${bookingId.slice(0, 8).toUpperCase()}`,
      TransactionDesc: `TrackWash Booking ${bookingId.slice(0, 8).toUpperCase()}`,
    };

    console.log("STK Push payload:", JSON.stringify(stkPayload, null, 2));

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();
    console.log("STK Push response:", JSON.stringify(stkResult, null, 2));

    if (stkResult.ResponseCode !== "0") {
      return new Response(
        JSON.stringify({ 
          error: stkResult.ResponseDescription || "STK Push failed",
          details: stkResult 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store payment record in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount_kes: amount,
        payment_method: "mpesa",
        status: "processing",
        mpesa_checkout_request_id: stkResult.CheckoutRequestID,
        mpesa_merchant_request_id: stkResult.MerchantRequestID,
        phone_number: formattedPhone,
      });

    if (insertError) {
      console.error("Failed to store payment:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutRequestId: stkResult.CheckoutRequestID,
        merchantRequestId: stkResult.MerchantRequestID,
        responseDescription: stkResult.ResponseDescription,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("M-Pesa STK Push error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
