'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.FROM_EMAIL || 'KL Vase <noreply@klvase.com>';
  const transport = getTransporter();

  if (!transport) {
    logger.info(`[EMAIL SIMULATION] To: ${to} | Subject: "${subject}"`);
    return { simulated: true };
  }

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html,
    });
    logger.info('Email sent successfully', { messageId: info.messageId, to, subject });
    return info;
  } catch (err) {
    logger.error('Failed to send email', { error: err.message, to, subject });
    // Non-blocking: don't crash caller
    return null;
  }
}

async function sendWelcomeEmail(user) {
  const subject = 'Welcome to KL Vase Atelier';
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; background: #FDFBF7; color: #4A3528; padding: 40px; border-radius: 8px;">
      <h1 style="font-family: Georgia, serif; color: #C5A059; margin-bottom: 20px;">Welcome, ${user.name}!</h1>
      <p style="font-size: 15px; line-height: 1.6;">Thank you for joining KL Vase. We are delighted to have you as part of our community celebrating bespoke art and ceramic craftsmanship.</p>
      <p style="font-size: 15px; line-height: 1.6;">Discover our latest artisanal collections created with uncompromising dedication to form and beauty.</p>
      <br/>
      <p style="font-size: 13px; color: #888;">KL Vase Atelier · Kolkata, India</p>
    </div>
  `;
  return sendMail({ to: user.email, subject, html });
}

async function sendOrderConfirmation(order, userEmail, userName) {
  const subject = `Order Confirmed: #${order._id.toString().slice(-8).toUpperCase()}`;
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0dcd5;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0dcd5; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0dcd5; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: 'Montserrat', sans-serif; background: #FDFBF7; color: #4A3528; padding: 40px; max-width: 600px; margin: auto;">
      <h2 style="font-family: Georgia, serif; color: #C5A059;">Order Confirmed!</h2>
      <p>Dear ${userName || 'Customer'},</p>
      <p>Your payment of <strong>₹${order.totalAmount.toLocaleString('en-IN')}</strong> has been confirmed. Your order is now being carefully prepared by our atelier team.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
        <thead>
          <tr style="background: #4A3528; color: #FDFBF7;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="font-size: 14px;"><strong>Shipping Address:</strong><br/>
      ${order.shippingAddress?.fullName}<br/>
      ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}
      </p>

      <hr style="border: none; border-top: 1px solid #e0dcd5; margin: 30px 0;" />
      <p style="font-size: 12px; color: #888;">If you have any questions, reply directly to this email or visit our website.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject, html });
}

async function sendOrderStatusUpdate(order, userEmail, userName, newStatus) {
  const subject = `Order #${order._id.toString().slice(-8).toUpperCase()} Status Update: ${newStatus.toUpperCase()}`;
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; background: #FDFBF7; color: #4A3528; padding: 40px; max-width: 600px; margin: auto;">
      <h2 style="font-family: Georgia, serif; color: #C5A059;">Order Status Update</h2>
      <p>Dear ${userName || 'Customer'},</p>
      <p>Your order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been updated to: <strong style="color: #C5A059;">${newStatus.toUpperCase()}</strong>.</p>
      <p>Thank you for choosing KL Vase.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject, html });
}

async function sendOrderCancellation(order, userEmail, userName) {
  const subject = `Order Cancelled: #${order._id.toString().slice(-8).toUpperCase()}`;
  const html = `
    <div style="font-family: 'Montserrat', sans-serif; background: #FDFBF7; color: #4A3528; padding: 40px; max-width: 600px; margin: auto;">
      <h2 style="font-family: Georgia, serif; color: #ef4444;">Order Cancelled</h2>
      <p>Dear ${userName || 'Customer'},</p>
      <p>Your order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been cancelled successfully.</p>
      <p>If payment was already completed, our team will process your refund according to our refund policies.</p>
    </div>
  `;
  return sendMail({ to: userEmail, subject, html });
}

async function sendContactNotification(inquiry) {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.FROM_EMAIL;
  if (!superAdminEmail) return;

  const subject = `New Inquiry from ${inquiry.name}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h3>New Customer Inquiry</h3>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f4f4f4; padding: 15px; border-radius: 4px;">${inquiry.message}</div>
    </div>
  `;
  return sendMail({ to: superAdminEmail, subject, html });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendContactNotification,
};
