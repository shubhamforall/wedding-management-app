const ROLE_COPY: Record<string, string> = {
  owner: 'full control, including managing members and deleting the wedding',
  member: 'edit access to guests, budget, tasks, vendors, and everything else',
  viewer: 'read-only access to view all wedding details',
};

export interface InvitationEmailInput {
  inviterName: string | null;
  recipientName: string | null;
  weddingName: string;
  brideName: string | null;
  groomName: string | null;
  role: string;
  invitationUrl: string;
  expiresAt: Date;
}

export function createInvitationEmail(input: InvitationEmailInput): { subject: string; html: string; text: string } {
  const inviter = input.inviterName ?? 'Someone';
  const greetingName = input.recipientName ?? 'there';
  const roleDescription = ROLE_COPY[input.role] ?? 'access to this wedding';
  const coupleNames = [input.brideName, input.groomName].filter(Boolean).join(' & ');
  const expiryText = input.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `You're invited to join a wedding team`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#7c3aed;padding:22px 24px;text-align:center;">
                <p style="margin:0;color:#fff;font-size:17px;font-weight:700;letter-spacing:0.01em;">Wedding Management</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <p style="margin:0 0 12px;color:#111;font-size:15px;">Hi ${greetingName},</p>
                <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
                  <strong>${inviter}</strong> has invited you to join their wedding management team.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7ff;border:1px solid #ece7fc;border-radius:8px;margin:0 0 16px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0;color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Wedding</p>
                      <p style="margin:3px 0 0;color:#111;font-size:18px;font-weight:700;">${input.weddingName}</p>
                      ${coupleNames ? `<p style="margin:4px 0 0;color:#555;font-size:13px;">${coupleNames}</p>` : ''}
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 20px;color:#333;font-size:14px;line-height:1.6;">
                  You've been given <strong>${input.role}</strong> access — ${roleDescription}. You can join the wedding team
                  and help manage guests, tasks, vendors, budget, and other wedding activities.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:8px 0 20px;">
                      <a href="${input.invitationUrl}" style="display:inline-block;padding:13px 28px;background:#7c3aed;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accept Invitation</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 4px;color:#888;font-size:12px;">If the button doesn't work, copy and paste this link:</p>
                <p style="margin:0 0 20px;word-break:break-all;">
                  <a href="${input.invitationUrl}" style="color:#7c3aed;font-size:12px;">${input.invitationUrl}</a>
                </p>
                <p style="margin:0;color:#999;font-size:12px;">This invitation expires on ${expiryText}. If you weren't expecting this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #eee;">
                <p style="margin:0;color:#aaa;font-size:11px;">Regards,<br/>Wedding Management</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hi ${greetingName},`,
    '',
    `${inviter} has invited you to join their wedding management team.`,
    '',
    `Wedding: ${input.weddingName}`,
    ...(coupleNames ? [coupleNames] : []),
    `Role: ${input.role}`,
    '',
    `You can join the wedding team and help manage guests, tasks, vendors, budget, and other wedding activities.`,
    '',
    `Accept Invitation: ${input.invitationUrl}`,
    '',
    `This invitation expires on ${expiryText}.`,
    `If you were not expecting this invitation, you can safely ignore this email.`,
    '',
    `Regards,`,
    `Wedding Management`,
  ].join('\n');

  return { subject, html, text };
}
