import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_xxxxxxxxx');

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
    // For local development or if API key is not configured, just log the URL
    if (!process.env.RESEND_API_KEY) {
        console.log('\n========================================================');
        console.log('🔒 PASSWORD RESET EMAIL MOCK');
        console.log(`To: ${to}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('========================================================\n');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: process.env.SMTP_FROM || 'onboarding@resend.dev',
            to,
            subject: 'Reset your Edmin Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset for your Edmin account.</p>
                    <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
                    <p>If you did not request this, you can safely ignore this email.</p>
                </div>
            `,
        });
        console.log('Email sent successfully via Resend:', data);
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};
