'use strict';

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { apiLimiter } = require('../middleware/rateLimiter');

router.post('/', apiLimiter, contactController.submitInquiry);

module.exports = router;
