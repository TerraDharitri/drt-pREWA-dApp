// This is an example implementation. You would need to install a library like `nodemailer` or `@sendgrid/mail`.
// import sgMail from '@sendgrid/mail';

// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailNotifier {
  private toEmail: string;

  constructor(toEmail: string) {
    this.toEmail = toEmail;
    console.log(`Email notifier configured for ${toEmail}`);
  }

  public async send(subject: string, htmlContent: string): Promise<void> {
    const msg = {
      to: this.toEmail,
      from: 'alerts@drt-prewa.org', // Use a verified sender
      subject: `pREWA Alert: ${subject}`,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">${htmlContent}</div>`,
    };

    try {
      // await sgMail.send(msg);
      console.log(`[SIMULATED] Email alert sent to ${this.toEmail}. Subject: ${subject}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
}