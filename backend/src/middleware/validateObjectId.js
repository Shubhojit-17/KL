'use strict';

const mongoose = require('mongoose');

function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    next();
  };
}

module.exports = validateObjectId;
