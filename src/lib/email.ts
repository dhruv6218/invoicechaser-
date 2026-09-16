import { Resend } from 'resend';

/**
 * Email service using Resend.
 * Sends reminder emails to clients on behalf of the user.
 */

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const resend = getResend();
  const from = params.from || process.env.RESEND_FROM_EMAIL || 'Astrix AI <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });

  if (error) {
    console.error('[Email] Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

/**
 * Build the HTML email body for a reminder email.
 */
export function buildReminderEmailHTML(params: {
  emailContent: string;
  paymentLink: string;
  invoiceId: string;
  workspaceName: string;
}): string {
  const { emailContent, paymentLink, invoiceId, workspaceName } = params;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:24px 40px;background:#0f172a;">
              <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ASTRIX AI</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <div style="white-space:pre-wrap;font-size:15px;line-height:1.7;color:#1f2937;">${emailContent.replace(/</g, '<').replace(/>/g, '>')}</div>

              <div style="margin:32px 0;">
                <a href="${paymentLink}" style="display:inline-block;background:#1a56ff;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;">Pay Now →</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Sent by ${workspaceName} via Astrix AI · Invoice #${invoiceId}<br/>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/already-paid/${invoiceId}" style="color:#64748b;text-decoration:underline;">Already paid? Click here</a>
                · <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dispute/${invoiceId}" style="color:#64748b;text-decoration:underline;">Dispute this invoice</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
