// Supabase Edge Function: send-invitation-email
//
// Invoked from the client (features/members/api.ts inviteMember / resendInvitation)
// right after a wedding_invitations row is written. Looks the row back up with
// the service role key (bypasses RLS — this function is the trusted server side),
// then emails the invite link via Resend.
//
// Required secrets (set with `supabase secrets set`):
//   RESEND_API_KEY   - from resend.com
//   APP_URL          - e.g. https://your-app.vercel.app (used to build the invite link)
//   FROM_EMAIL       - optional, defaults to Resend's sandbox sender. Sandbox sender
//                       can only deliver to the email the Resend account was created
//                       with; set a verified-domain address here once you've verified
//                       one in Resend to send to arbitrary invitees.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.
//
// Deploy: supabase functions deploy send-invitation-email

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Wedding Planner <onboarding@resend.dev>';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ROLE_COPY: Record<string, string> = {
  owner: 'Owner — full access, can manage members and delete the wedding',
  member: 'Member — can add and edit guests, budget, tasks, and more',
  viewer: 'Viewer — read-only access to everything',
};

function buildEmail(opts: {
  inviterName: string;
  weddingName: string;
  brideName: string;
  groomName: string;
  role: string;
  inviteLink: string;
  expiresAt: string;
  recipientEmail: string;
}) {
  const { inviterName, weddingName, brideName, groomName, role, inviteLink, expiresAt, recipientEmail } = opts;
  const roleLine = ROLE_COPY[role] ?? role;
  const expiryDate = new Date(expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You're invited</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f6; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 1px 3px rgba(16,16,20,0.08);">

            <!-- Header -->
            <tr>
              <td style="background-color:#7c3aed; padding: 32px 32px 28px; text-align:center;">
                <div style="width:48px; height:48px; background-color:rgba(255,255,255,0.15); border-radius:12px; display:inline-block; line-height:48px; font-size:24px; margin-bottom:12px;">
                  &#10084;&#65039;
                </div>
                <div style="color:#ffffff; font-size:20px; font-weight:600;">You're invited!</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#3a3a42;">
                  <strong>${escapeHtml(inviterName)}</strong> invited you to help plan
                </p>

                <div style="text-align:center; padding: 20px 0 24px;">
                  <div style="font-size:22px; font-weight:700; color:#16161a;">${escapeHtml(weddingName)}</div>
                  ${
                    brideName || groomName
                      ? `<div style="font-size:14px; color:#6b6b76; margin-top:4px;">${escapeHtml(brideName)}${brideName && groomName ? ' &amp; ' : ''}${escapeHtml(groomName)}</div>`
                      : ''
                  }
                </div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f8; border-radius:10px; margin-bottom:24px;">
                  <tr>
                    <td style="padding: 14px 16px; font-size:13px; color:#6b6b76;">
                      Your role: <strong style="color:#16161a;">${escapeHtml(roleLine)}</strong>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${inviteLink}" style="display:inline-block; background-color:#7c3aed; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding: 13px 32px; border-radius:10px;">
                        Accept Invitation
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 24px 0 0; font-size:12px; line-height:1.6; color:#9a9aa4; text-align:center;">
                  This invite was sent to ${escapeHtml(recipientEmail)} and expires on ${expiryDate}.<br />
                  If the button doesn't work, copy this link:<br />
                  <a href="${inviteLink}" style="color:#7c3aed; word-break:break-all;">${inviteLink}</a>
                </p>
              </td>
            </tr>
          </table>

          <p style="margin: 20px 0 0; font-size:12px; color:#9a9aa4; text-align:center;">
            Sent by the Wedding Management app. If you weren't expecting this, you can ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${inviterName} invited you to help plan ${weddingName}${brideName || groomName ? ` (${[brideName, groomName].filter(Boolean).join(' & ')})` : ''}.`,
    ``,
    `Your role: ${roleLine}`,
    ``,
    `Accept the invitation: ${inviteLink}`,
    ``,
    `This invite was sent to ${recipientEmail} and expires on ${expiryDate}.`,
  ].join('\n');

  return { html, text };
}

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
      supabaseAdmin.from('weddings').select('name, bride_name, groom_name').eq('id', invitation.wedding_id).single(),
      supabaseAdmin.from('user_profiles').select('full_name').eq('id', invitation.invited_by).single(),
    ]);

    const inviteLink = `${APP_URL}/invite/${invitation.token}`;

    if (!RESEND_API_KEY) {
      // No email provider configured yet — the invitation row still exists and
      // the owner can copy/share the link manually from the Members page.
      console.warn('RESEND_API_KEY not set; skipping email send for invitation', invitationId);
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), { status: 200 });
    }

    const { html, text } = buildEmail({
      inviterName: inviter?.full_name ?? 'Someone',
      weddingName: wedding?.name ?? 'a wedding',
      brideName: wedding?.bride_name ?? '',
      groomName: wedding?.groom_name ?? '',
      role: invitation.role,
      inviteLink,
      expiresAt: invitation.expires_at,
      recipientEmail: invitation.email,
    });

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [invitation.email],
        subject: `${inviter?.full_name ?? 'Someone'} invited you to plan ${wedding?.name ?? 'a wedding'}`,
        html,
        text,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend send failed', errBody);
      return new Response(JSON.stringify({ sent: false, error: errBody }), { status: 502 });
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
