const express = require('express');
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');

const router = express.Router();

// Validation for recording a payment
const recordPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isInt({ min: 1 })
    .withMessage('Payment amount must be an integer greater than or equal to 1'),
  body('pledgeId')
    .optional()
    .isMongoId()
    .withMessage('pledgeId must be a valid MongoDB ObjectId'),
  body('pledge')
    .optional()
    .isMongoId()
    .withMessage('pledge must be a valid MongoDB ObjectId'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'credit_card', 'online', 'other'])
    .withMessage('Invalid payment method'),
  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number cannot exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// All payment routes require authentication
router.use(protect);

// Record payment: Admin only
router.post('/', restrictTo('admin'), recordPaymentValidation, paymentController.recordPayment);

// Get all payments: Admin only
router.get('/', restrictTo('admin'), paymentController.getAllPayments);

// Get payments for a specific pledge: Admin or the Donor who created it
router.get(
  '/pledge/:pledgeId',
  [
    param('pledgeId')
      .isMongoId()
      .withMessage('pledgeId must be a valid MongoDB ObjectId')
  ],
  paymentController.getPaymentsByPledgeId
);

module.exports = router;