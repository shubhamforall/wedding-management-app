import { sendViaSmtp } from './smtp.service';
import { createInvitationEmail, type InvitationEmailInput } from './templates/invitation.template';
import { createVerificationEmail } from './templates/verification.template';
import { createPasswordResetEmail } from './templates/passwordReset.template';

// The rest of the app calls only this file, never nodemailer or
// smtp.service.ts directly — swapping SMTP for another provider later only
// touches smtp.service.ts, not the invitation/auth flows that send email.
export interface SendResult {
  sent: boolean;
  reason?: string;
}

export function sendVerificationEmail(to: string, verifyUrl: string): Promise<SendResult> {
  const { subject, html, text } = createVerificationEmail(verifyUrl);
  return sendViaSmtp({ to, subject, html, text });
}

export function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
  const { subject, html, text } = createPasswordResetEmail(resetUrl);
  return sendViaSmtp({ to, subject, html, text });
}

export function sendInvitationEmail(input: InvitationEmailInput & { to: string }): Promise<SendResult> {
  const { subject, html, text } = createInvitationEmail(input);
  return sendViaSmtp({ to: input.to, subject, html, text });
}
