export function createVerificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Verify your email',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Verify email</a>
        <p style="color:#666;font-size:13px;margin-top:24px">If you didn't create an account, you can ignore this email.</p>
      </div>`,
    text: `Verify your email: ${verifyUrl}`,
  };
}
