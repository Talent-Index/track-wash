import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MPesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callback: MPesaCallback = await req.json();
    const stkCallback = callback.Body.stkCallback;

    console.log("M-Pesa Callback received:", JSON.stringify(callback, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the payment record
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*, bookings(*)")
      .eq("mpesa_checkout_request_id", stkCallback.CheckoutRequestID)
      .single();

    if (findError || !payment) {
      console.error("Payment not found:", stkCallback.CheckoutRequestID);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find((m) => m.Name === "MpesaReceiptNumber")?.Value as string;
      const transactionDate = metadata.find((m) => m.Name === "TransactionDate")?.Value as string;
      const phoneNumber = metadata.find((m) => m.Name === "PhoneNumber")?.Value as string;

      console.log("Payment successful:", { mpesaReceiptNumber, transactionDate, phoneNumber });

      // Update payment status
      await supabase
        .from("payments")
        .update({
          status: "completed",
          mpesa_receipt_number: mpesaReceiptNumber,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", payment.booking_id);

      // Log activity
      await supabase
        .from("booking_activity_logs")
        .insert({
          booking_id: payment.booking_id,
          action: "payment_confirmed",
          details: {
            method: "mpesa",
            receipt: mpesaReceiptNumber,
            amount: payment.amount_kes,
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
          bookingId: payment.booking_id,
          data: {
            receipt: mpesaReceiptNumber,
            amount: payment.amount_kes,
          },
        }),
      });

    } else {
      // Payment failed
      console.log("Payment failed:", stkCallback.ResultDesc);

      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      await supabase
        .from("booking_activity_logs")
        .insert({
          booking_id: payment.booking_id,
          action: "payment_failed",
          details: {
            reason: stkCallback.ResultDesc,
          },
        });
    }

    // M-Pesa expects this response format
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Callback processing error:", error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
});
