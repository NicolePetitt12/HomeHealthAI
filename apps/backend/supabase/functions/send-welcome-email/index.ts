import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { sendEmail } from '../_shared/email/index.ts';
import type { WelcomeEmailData } from '../_shared/email/index.ts';

serve(async (req) => {
  try {
    const { record } = await req.json();

    if (!record || !record.email || !record.full_name) {
      console.error('Invalid payload:', { record });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailData: WelcomeEmailData = {
      type: 'welcome',
      to: record.email,
      subject: 'Welcome to Inspector Gnome!',
      recipientName: record.full_name,
    };

    // Send email (fire-and-forget, don't block on errors)
    sendEmail(emailData).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing welcome email request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
