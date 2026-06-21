const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@edupulsa.com';

let isConfigured = false;

if (API_KEY) {
  try {
    sgMail.setApiKey(API_KEY);
    isConfigured = true;
    console.log('SendGrid email service configured');
  } catch (err) {
    console.error('SendGrid configuration error:', err.message);
  }
} else {
  console.log('SendGrid API key not set. Emails will be logged to console only.');
}

async function sendVerificationEmail(email, name, code) {
  if (!isConfigured) {
    console.log(`[EMAIL NOT SENT - SendGrid not configured] Verification code for ${email}: ${code}`);
    return { sent: false, reason: 'SendGrid not configured' };
  }

  try {
    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Verify your EduPlan SA account',
      text: `Hi ${name},

Thank you for signing up for EduPlan SA! Your verification code is: ${code}

Enter this code in the app to verify your email address.

If you didn't sign up for this account, you can ignore this email.

Best regards,
EduPlan SA Team`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Welcome to EduPlan SA!</h2>
  <p>Hi ${name},</p>
  <p>Thank you for signing up. Please verify your email address using the code below:</p>
  <div style="background:#E6F5F4;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0F3D3E;margin:0">${code}</p>
  </div>
  <p style="color:#666;font-size:14px">If you didn't sign up for this account, you can ignore this email.</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`,
    });
    console.log(`Verification email sent to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendPasswordResetEmail(email, name, token) {
  if (!isConfigured) {
    console.log(`[EMAIL NOT SENT - SendGrid not configured] Password reset token for ${email}: ${token}`);
    return { sent: false, reason: 'SendGrid not configured' };
  }

  try {
    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Reset your EduPlan SA password',
      text: `Hi ${name},

You requested a password reset for your EduPlan SA account. Your reset token is:

${token}

Enter this token in the app to set a new password. This token expires in 1 hour.

If you didn't request this, you can ignore this email.

Best regards,
EduPlan SA Team`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Password Reset</h2>
  <p>Hi ${name},</p>
  <p>You requested a password reset. Use the token below:</p>
  <div style="background:#E6F5F4;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
    <p style="font-size:14px;font-weight:bold;color:#0F3D3E;margin:0;word-break:break-all">${token}</p>
  </div>
  <p style="color:#666;font-size:14px">This token expires in 1 hour. If you didn't request this, ignore this email.</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`,
    });
    console.log(`Password reset email sent to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
    return { sent: false, reason: err.message };
  }
}

async function sendWelcomeEmail(email, name) {
  if (!isConfigured) {
    console.log(`[EMAIL NOT SENT] Welcome email to ${email}`);
    return { sent: false };
  }

  try {
    await sgMail.send({
      to: email,
      from: FROM_EMAIL,
      subject: 'Welcome to EduPlan SA!',
      text: `Hi ${name},

Welcome to EduPlan SA! Your account has been verified successfully.

You now have access to:
- CAPS-aligned lesson plans
- Student management
- Attendance tracking
- Marks recording
- Study guides
- And more!

Your 1-month free trial is now active. Enjoy using EduPlan SA!

Best regards,
EduPlan SA Team`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Welcome to EduPlan SA!</h2>
  <p>Hi ${name},</p>
  <p>Your account has been verified successfully. You now have access to:</p>
  <ul style="color:#333;line-height:1.8">
    <li>CAPS-aligned lesson plans</li>
    <li>Student management</li>
    <li>Attendance tracking</li>
    <li>Marks recording</li>
    <li>Study guides</li>
  </ul>
  <p style="background:#E6F5F4;padding:12px;border-radius:8px;color:#0F3D3E;font-weight:500">Your 1-month free trial is now active!</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`,
    });
    console.log(`Welcome email sent to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
    return { sent: false };
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, isConfigured };
