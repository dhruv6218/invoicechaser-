import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Contact form endpoint.
 * POST: Sends contact form submission to the configured CONTACT_EMAIL via Resend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Rate limit: check if CONTACT_EMAIL is configured
    const contactEmail = process.env.CONTACT_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (!contactEmail) {
      return NextResponse.json({ error: 'Contact email not configured' }, { status: 500 });
    }

    if (!resendKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    const subjectMap: Record<string, string> = {
      sales: 'Sales & Enterprise Pricing',
      support: 'Technical Support',
      partnership: 'Partnerships',
      other: 'General Inquiry',
    };

    const subjectLabel = subjectMap[subject] || 'General Inquiry';
    const fullName = `${firstName} ${lastName}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:24px 40px;background:#0f172a;">
              <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ASTRIX AI — New Contact Form Submission</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;font-weight:600;width:120px;">Name</td>
                  <td style="padding:8px 0;font-size:15px;color:#1f2937;font-weight:700;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;font-weight:600;">Email</td>
                  <td style="padding:8px 0;font-size:15px;color:#1f2937;font-weight:700;"><a href="mailto:${email}" style="color:#1a56ff;text-decoration:none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748b;font-weight:600;">Subject</td>
                  <td style="padding:8px 0;font-size:15px;color:#1f2937;font-weight:700;">${subjectLabel}</td>
                </tr>
              </table>
              <div style="margin:24px 0;border-top:1px solid #e2e8f0;"></div>
              <p style="font-size:14px;color:#64748b;font-weight:600;margin-bottom:8px;">Message:</p>
              <div style="font-size:15px;line-height:1.7;color:#1f2937;white-space:pre-wrap;">${message}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">This email was sent from the Astrix AI contact form at ${new Date().toISOString()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: 'Astrix Contact <noreply@astrix.ai>',
      to: [contactEmail],
      replyTo: email,
      subject: `[Astrix Contact] ${subjectLabel} — from ${fullName}`,
      html,
    });

    if (error) {
      console.error('[Contact] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Contact] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
