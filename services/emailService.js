const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Gmail SMTP configuration with Railway hosting optimizations
const emailConfig = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER || 'amankachura2975@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'ilsk pond lszj xjsi'
  },
  // Railway hosting optimizations
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 20000, // 20 seconds
  rateLimit: 5, // max 5 messages per rateDelta
  // Retry configuration
  retryDelay: 5000, // 5 seconds
  retryAttempts: 3,
  // Debug mode for Railway
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify email connection
const verifyEmailConnection = async () => {
  try {
    console.log('🔍 Verifying email service connection...');
    await transporter.verify();
    console.log('✅ Email service connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send OTP for login verification with retry logic
const sendOTPEmail = async (email, otp, retryCount = 0) => {
  try {
    console.log(`📧 Sending OTP email to ${email} (attempt ${retryCount + 1})`);
    
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: process.env.GMAIL_USER || 'amankachura2975@gmail.com'
      },
      to: email,
      subject: 'Your hugli account Login Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>We detected a login attempt from a new device.</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #007bff; letter-spacing: 2px;">${otp}</strong></p>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't attempt to login, please secure your account.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">This is an automated message from Hugli printing service.</p>
        </div>
      `,
      text: `Your login verification code is: ${otp}. This code will expire in 10 minutes.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending OTP email (attempt ${retryCount + 1}):`, error.message);
    
    // Retry logic for Railway hosting
    if (retryCount < 2 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message.includes('timeout'))) {
      console.log(`🔄 Retrying OTP email in 5 seconds... (attempt ${retryCount + 2})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return sendOTPEmail(email, otp, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
};

// Send email verification for signup with retry logic
const sendVerificationEmail = async (email, verificationToken, retryCount = 0) => {
  try {
    console.log(`📧 Sending verification email to ${email} (attempt ${retryCount + 1})`);
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: process.env.GMAIL_USER || 'amankachura2975@gmail.com'
      },
      to: email,
      subject: 'Verify Your Hugli Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Hugli!</h2>
          <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666;">Or copy and paste this link in your browser:</p>
          <p style="color: #007bff; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #666;">This link will expire in 24 hours.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">This is an automated message from Hugli printing service.</p>
        </div>
      `,
      text: `Please verify your email by clicking this link: ${verificationUrl}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending verification email (attempt ${retryCount + 1}):`, error.message);
    
    // Retry logic for Railway hosting
    if (retryCount < 2 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message.includes('timeout'))) {
      console.log(`🔄 Retrying verification email in 5 seconds... (attempt ${retryCount + 2})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return sendVerificationEmail(email, verificationToken, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
};

// Send password reset email with retry logic
const sendPasswordResetEmail = async (email, resetToken, retryCount = 0) => {
  try {
    console.log(`📧 Sending password reset email to ${email} (attempt ${retryCount + 1})`);
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: process.env.GMAIL_USER || 'amankachura2975@gmail.com'
      },
      to: email,
      subject: 'Reset Your Hugli Account Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666;">Or copy and paste this link in your browser:</p>
          <p style="color: #007bff; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666;">This link will expire in 1 hour.</p>
          <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">This is an automated message from Hugli printing service.</p>
        </div>
      `,
      text: `Reset your password by clicking this link: ${resetUrl}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending password reset email (attempt ${retryCount + 1}):`, error.message);
    
    // Retry logic for Railway hosting
    if (retryCount < 2 && (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.message.includes('timeout'))) {
      console.log(`🔄 Retrying password reset email in 5 seconds... (attempt ${retryCount + 2})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return sendPasswordResetEmail(email, resetToken, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  generateResetToken,
  sendOTPEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmailConnection
};
