'use strict';

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const AppError = require('../utils/AppError');

router.post('/', auth, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    throw new AppError('Please provide an image file.', 400, 'FILE_MISSING');
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully.',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    },
  });
});

module.exports = router;
