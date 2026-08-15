export function createPasswordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Reset password</a>
        <p style="color:#666;font-size:13px;margin-top:24px">If you didn't request this, you can ignore this email — your password will not change.</p>
      </div>`,
    text: `Reset your password: ${resetUrl}`,
  };
}
