/**
 * @fileoverview Request validation middleware for the LTraffic Admin API.
 * Collects validation errors produced by express-validator chain rules
 * defined on routes and returns a unified 422 error response.
 *
 * @module middlewares/validate.middleware
 */

const { validationResult } = require('express-validator');

/**
 * Middleware: checks the express-validator result for the current request.
 * If any validation rule failed, responds with 422 Unprocessable Entity
 * and a list of field-level error messages.
 * If validation passed, calls next() to continue to the controller.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
