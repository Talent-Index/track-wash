import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "booking_created" | "payment_confirmed" | "job_assigned" | "job_started" | "job_completed" | "car_ready";
  bookingId: string;
  data?: Record<string, unknown>;
  channels?: ("email" | "whatsapp")[];
}

const emailTemplates = {
  booking_created: (data: Record<string, unknown>) => ({
    subject: "Booking Confirmed - TrackWash",
    html: `
      <h1>Your TrackWash Booking is Confirmed!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your booking <strong>${data.bookingCode}</strong> has been created.</p>
      <ul>
        <li><strong>Service:</strong> ${data.packageName}</li>
        <li><strong>Date:</strong> ${data.scheduledDate}</li>
        <li><strong>Time:</strong> ${data.scheduledTime}</li>
        ${data.location ? `<li><strong>Location:</strong> ${data.location}</li>` : ""}
      </ul>
      <p>Please complete payment to confirm your booking.</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
  payment_confirmed: (data: Record<string, unknown>) => ({
    subject: "✅ Payment Received - TrackWash",
    html: `
      <h1>Payment Successful!</h1>
      <p>Hi ${data.customerName},</p>
      <p>We've received your payment of <strong>KES ${data.amount}</strong> for booking <strong>${data.bookingCode}</strong>.</p>
      ${data.receipt ? `<p>M-Pesa Receipt: <strong>${data.receipt}</strong></p>` : ""}
      ${data.txHash ? `<p>Transaction Hash: <strong>${data.txHash}</strong></p>` : ""}
      <p>Your booking is now confirmed. We'll assign a detailer shortly.</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
  job_assigned: (data: Record<string, unknown>) => ({
    subject: "🚗 Detailer Assigned - TrackWash",
    html: `
      <h1>Your Detailer is Assigned!</h1>
      <p>Hi ${data.customerName},</p>
      <p><strong>${data.detailerName}</strong> will be handling your car wash on ${data.scheduledDate} at ${data.scheduledTime}.</p>
      <p>They will contact you when they're on their way.</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
  job_started: (data: Record<string, unknown>) => ({
    subject: "🧼 Service In Progress - TrackWash",
    html: `
      <h1>Your Car is Being Detailed!</h1>
      <p>Hi ${data.customerName},</p>
      <p>${data.detailerName} has started working on your ${data.vehiclePlate}.</p>
      <p>We'll notify you when it's ready.</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
  job_completed: (data: Record<string, unknown>) => ({
    subject: "🎉 Car Ready for Pickup - TrackWash",
    html: `
      <h1>Your Car is Sparkling Clean!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Great news! Your ${data.vehiclePlate} is ready.</p>
      <p>Don't forget to rate your experience!</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
  car_ready: (data: Record<string, unknown>) => ({
    subject: "🎉 Your Car is Ready! - TrackWash",
    html: `
      <h1>Your Car Awaits!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your ${data.vehiclePlate} is ready for pickup!</p>
      <p>Thank you for choosing TrackWash. We hope to see you again!</p>
      <p>Best regards,<br>The TrackWash Team</p>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, bookingId, data: extraData, channels = ["email"] } = await req.json() as NotificationRequest;

    console.log("Notification request:", { type, bookingId, channels });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles:customer_id (full_name, email, phone),
        services:service_id (name),
        branches:branch_id (name)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingId);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const templateData = {
      customerName: booking.profiles?.full_name || "Valued Customer",
      customerEmail: booking.profiles?.email,
      customerPhone: booking.profiles?.phone,
      bookingCode: booking.booking_code,
      packageName: booking.services?.name || "Car Wash",
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time,
      location: booking.location_address,
      vehiclePlate: "Your Vehicle",
      ...extraData,
    };

    const results: Record<string, unknown> = {};

    // Send email
    if (channels.includes("email") && templateData.customerEmail) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        const template = emailTemplates[type]?.(templateData);

        if (template) {
          try {
            const emailResult = await resend.emails.send({
              from: "TrackWash <noreply@trackwash.co.ke>",
              to: [templateData.customerEmail],
              subject: template.subject,
              html: template.html,
            });
            results.email = { success: true, id: emailResult.data?.id };
            console.log("Email sent:", emailResult);

            // Log notification
            await supabase.from("notification_logs").insert({
              booking_id: bookingId,
              user_id: booking.customer_id,
              channel: "email",
              template: type,
              recipient: templateData.customerEmail,
              status: "sent",
            });
          } catch (emailError: unknown) {
            console.error("Email send error:", emailError);
            const errorMsg = emailError instanceof Error ? emailError.message : "Email send failed";
            results.email = { success: false, error: errorMsg };
          }
        }
      } else {
        console.warn("RESEND_API_KEY not configured");
        results.email = { success: false, error: "Email not configured" };
      }
    }

    // WhatsApp would be implemented here if WHATSAPP_ACCESS_TOKEN is available
    // For now, we log that it would be sent
    if (channels.includes("whatsapp") && templateData.customerPhone) {
      console.log("WhatsApp notification would be sent to:", templateData.customerPhone);
      results.whatsapp = { success: false, error: "WhatsApp not yet configured" };
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
