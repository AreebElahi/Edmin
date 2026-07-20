import nodemailer from 'nodemailer';

// Create a transport. In production, configure with real SMTP credentials.
// For development, we'll log the email contents or use a mock transport.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
    // For local development or if SMTP is not configured, just log the URL
    if (!process.env.SMTP_HOST) {
        console.log('\n========================================================');
        console.log('🔒 PASSWORD RESET EMAIL MOCK');
        console.log(`To: ${to}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('========================================================\n');
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Edmin Security" <security@edmin.com>',
        to,
        subject: 'Reset your Edmin Password',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}\n\nIf you did not request this, please ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your Edmin account.</p>
                <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #0078d4; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
                <p>If you did not request this, you can safely ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};
