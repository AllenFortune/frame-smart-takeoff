
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  user_id: string;
  email: string;
  full_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, full_name }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email, "for user:", user_id);

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Render the React email template
    const emailHtml = await renderAsync(
      React.createElement(WelcomeEmail, {
        userFirstName: full_name.split(' ')[0] || 'there',
        userEmail: email,
      })
    );

    // Send the welcome email
    const emailResponse = await resend.emails.send({
      from: "FING Framing Estimator <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to FING Framing Estimator! 🏗️",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email event in the database
    const { error: logError } = await supabase
      .from('email_events')
      .insert({
        user_id: user_id,
        email_type: 'welcome',
        status: 'sent'
      });

    if (logError) {
      console.error("Error logging email event:", logError);
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);

    // Try to log the error in the database if we have user_id
    try {
      const body = await new Request(req).json();
      if (body.user_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        await supabase
          .from('email_events')
          .insert({
            user_id: body.user_id,
            email_type: 'welcome',
            status: 'failed',
            error_message: error.message
          });
      }
    } catch (logError) {
      console.error("Error logging failed email:", logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
