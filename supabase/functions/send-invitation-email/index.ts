// Supabase Edge Function: send-invitation-email
//
// Invoked from the client (features/members/api.ts inviteMember / resendInvitation)
// right after a wedding_invitations row is written. Looks the row back up with
// the service role key (bypasses RLS — this function is the trusted server side),
// then emails the invite link via Resend.
//
// Required secrets (set with `supabase secrets set`):
//   RESEND_API_KEY   - from resend.com
//   APP_URL           - e.g. https://your-app.vercel.app (used to build the invite link)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.
//
// Deploy: supabase functions deploy send-invitation-email

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { invitationId } = await req.json();
    if (!invitationId) {
      return new Response(JSON.stringify({ error: 'invitationId is required' }), { status: 400 });
    }

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('wedding_invitations')
      .select('id, email, role, token, expires_at, wedding_id, invited_by')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), { status: 404 });
    }

    const [{ data: wedding }, { data: inviter }] = await Promise.all([
      supabaseAdmin.from('weddings').select('name').eq('id', invitation.wedding_id).single(),
      supabaseAdmin.from('user_profiles').select('full_name').eq('id', invitation.invited_by).single(),
    ]);

    const inviteLink = `${APP_URL}/invite/${invitation.token}`;
    const weddingName = wedding?.name ?? 'a wedding';
    const inviterName = inviter?.full_name ?? 'Someone';

    if (!RESEND_API_KEY) {
      // No email provider configured yet — the invitation row still exists and
      // the owner can copy/share the link manually from the Members page.
      console.warn('RESEND_API_KEY not set; skipping email send for invitation', invitationId);
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), { status: 200 });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wedding Management <onboarding@resend.dev>',
        to: [invitation.email],
        subject: `${inviterName} invited you to plan ${weddingName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>You're invited to ${weddingName}</h2>
            <p>${inviterName} invited you to collaborate as a <strong>${invitation.role}</strong>.</p>
            <p><a href="${inviteLink}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Accept Invitation</a></p>
            <p style="color:#888;font-size:12px;">This link expires on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error('Resend send failed', text);
      return new Response(JSON.stringify({ sent: false, error: text }), { status: 502 });
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
