'use strict';

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * POST /api/admin/assign-admin
 * Promote a user to admin role.
 * Only accessible by existing admins.
 */
const assignAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const targetUser = await User.findOne({ email: email.toLowerCase() });

  if (!targetUser) {
    throw new AppError('User with this email not found. They must sign in first.', 404, 'USER_NOT_FOUND');
  }

  if (targetUser.role === 'admin') {
    throw new AppError('This user is already an admin.', 400, 'ALREADY_ADMIN');
  }

  targetUser.role = 'admin';
  await targetUser.save();

  logger.info('Admin role assigned', {
    targetEmail: email,
    assignedBy: req.user.email,
  });

  res.status(200).json({
    success: true,
    message: `Admin role assigned to ${email}.`,
    data: {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    },
  });
});

/**
 * POST /api/admin/revoke-admin
 * Revoke admin role from a user.
 * Prevents self-demotion if the user is the last remaining admin.
 */
const revokeAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const targetUser = await User.findOne({ email: email.toLowerCase() });
  if (!targetUser) {
    throw new AppError('User with this email not found.', 404, 'USER_NOT_FOUND');
  }

  if (targetUser.role !== 'admin') {
    throw new AppError('This user is not an admin.', 400, 'NOT_ADMIN');
  }

  // Prevent self-demotion if only one admin
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount <= 1 && targetUser._id.toString() === req.user._id.toString()) {
    throw new AppError(
      'Cannot revoke admin. You are the only admin. Promote someone else first.',
      400,
      'LAST_ADMIN'
    );
  }

  targetUser.role = 'user';
  await targetUser.save();

  logger.info('Admin role revoked', {
    targetEmail: email,
    revokedBy: req.user.email,
  });

  res.status(200).json({
    success: true,
    message: `Admin role revoked from ${email}.`,
    data: {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    },
  });
});

/**
 * GET /api/admin/users
 * List all registered users (admin only).
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

module.exports = { assignAdmin, revokeAdmin, getAllUsers };
