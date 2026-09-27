'use strict';

const ContactInquiry = require('../models/ContactInquiry');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const emailService = require('../services/email.service');

/**
 * POST /api/contact
 * Submit contact message
 */
const submitInquiry = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    throw new AppError('Name, email, and message are required.', 400, 'VALIDATION_ERROR');
  }

  const inquiry = await ContactInquiry.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
  });

  // Non-blocking notification
  emailService.sendContactNotification(inquiry).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out. We will get back to you shortly.',
    data: { inquiryId: inquiry._id },
  });
});

/**
 * GET /api/admin/contact-inquiries (Admin only)
 */
const getInquiries = asyncHandler(async (req, res) => {
  const inquiries = await ContactInquiry.find().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({
    success: true,
    data: { inquiries },
  });
});

module.exports = {
  submitInquiry,
  getInquiries,
};
