const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Gmail SMTP configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'amankachura2975@gmail.com',
    pass: 'ilsk pond lszj xjsi'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send OTP for login verification
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: 'amankachura2975@gmail.com'
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
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send email verification for signup
const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: 'amankachura2975@gmail.com'
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
    console.error('❌ Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Hugli Printing Service',
        address: 'amankachura2975@gmail.com'
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
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  generateResetToken,
  sendOTPEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
