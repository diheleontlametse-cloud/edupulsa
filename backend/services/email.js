const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

// ==================== CONFIG ====================
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@edupulsa.com';
const FROM_NAME = process.env.FROM_NAME || 'EduPlan SA';

// ==================== PROVIDER DETECTION ====================
let activeProvider = null;
let sgConfigured = false;
let resendConfigured = false;
let gmailConfigured = false;
let gmailTransporter = null;

// Try SendGrid
if (SENDGRID_KEY) {
  try {
    sgMail.setApiKey(SENDGRID_KEY);
    sgConfigured = true;
    activeProvider = 'sendgrid';
    console.log('Email provider: SendGrid configured');
  } catch (err) {
    console.error('SendGrid init error:', err.message);
  }
}

// Try Resend (preferred if no SendGrid)
if (RESEND_KEY && !activeProvider) {
  resendConfigured = true;
  activeProvider = 'resend';
  console.log('Email provider: Resend configured');
}

// Try Gmail SMTP (fallback)
if (GMAIL_USER && GMAIL_PASS && !activeProvider) {
  try {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
    gmailConfigured = true;
    activeProvider = 'gmail';
    console.log('Email provider: Gmail SMTP configured');
  } catch (err) {
    console.error('Gmail SMTP init error:', err.message);
  }
}

if (!activeProvider) {
  console.log('No email provider configured. Emails will be logged to console only.');
  console.log('To enable real emails, add one of these to Render Environment Variables:');
  console.log('  - RESEND_API_KEY=...    (recommended, no phone verification)');
  console.log('  - SENDGRID_API_KEY=...   (requires phone verification)');
  console.log('  - GMAIL_USER=... + GMAIL_APP_PASSWORD=...');
}

// ==================== RESEND HELPER ====================
async function sendViaResend(to, subject, text, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Resend error');
  return data;
}

// ==================== SEND FUNCTIONS ====================
async function sendEmail(to, subject, text, html) {
  if (!activeProvider) {
    console.log(`[EMAIL NOT SENT] To: ${to}, Subject: ${subject}`);
    return { sent: false, provider: 'none' };
  }

  try {
    if (activeProvider === 'resend') {
      await sendViaResend(to, subject, text, html);
      console.log(`Email sent via Resend to ${to}`);
      return { sent: true, provider: 'resend' };
    }

    if (activeProvider === 'sendgrid') {
      await sgMail.send({
        to,
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        subject,
        text,
        html,
      });
      console.log(`Email sent via SendGrid to ${to}`);
      return { sent: true, provider: 'sendgrid' };
    }

    if (activeProvider === 'gmail') {
      await gmailTransporter.sendMail({
        from: `${FROM_NAME} <${GMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent via Gmail to ${to}`);
      return { sent: true, provider: 'gmail' };
    }
  } catch (err) {
    console.error(`Email send failed (${activeProvider}):`, err.message);
    return { sent: false, provider: activeProvider, error: err.message };
  }
}

// ==================== TEMPLATED EMAILS ====================
async function sendVerificationEmail(email, name, code) {
  const result = await sendEmail(
    email,
    'Verify your EduPlan SA account',
    `Hi ${name},\n\nYour verification code is: ${code}\n\nEnter this in the app to verify your email.\n\nEduPlan SA Team`,
    `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Welcome to EduPlan SA!</h2>
  <p>Hi ${name},</p>
  <p>Your verification code:</p>
  <div style="background:#E6F5F4;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#0F3D3E;margin:0">${code}</p>
  </div>
  <p style="color:#666;font-size:14px">Enter this code in the app to verify your email.</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`
  );
  return result;
}

async function sendPasswordResetEmail(email, name, token) {
  const result = await sendEmail(
    email,
    'Reset your EduPlan SA password',
    `Hi ${name},\n\nYour password reset token is:\n\n${token}\n\nThis token expires in 1 hour.\n\nEduPlan SA Team`,
    `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Password Reset</h2>
  <p>Hi ${name},</p>
  <p>Your reset token:</p>
  <div style="background:#E6F5F4;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
    <p style="font-size:14px;font-weight:bold;color:#0F3D3E;margin:0;word-break:break-all">${token}</p>
  </div>
  <p style="color:#666;font-size:14px">This token expires in 1 hour.</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`
  );
  return result;
}

async function sendWelcomeEmail(email, name) {
  const result = await sendEmail(
    email,
    'Welcome to EduPlan SA!',
    `Hi ${name},\n\nWelcome! Your account is verified and your 1-month free trial is active.\n\nEduPlan SA Team`,
    `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
  <h2 style="color:#0F3D3E;margin-bottom:16px">Welcome to EduPlan SA!</h2>
  <p>Hi ${name},</p>
  <p>Your account is verified and your 1-month free trial is active!</p>
  <p style="background:#E6F5F4;padding:12px;border-radius:8px;color:#0F3D3E;font-weight:500">Enjoy using EduPlan SA!</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
  <p style="color:#999;font-size:12px">EduPlan SA — South African Education Management</p>
</div>`
  );
  return result;
}

function getProvider() {
  return activeProvider || 'none';
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, getProvider };
