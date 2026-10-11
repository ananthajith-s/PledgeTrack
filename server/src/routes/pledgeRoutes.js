const express = require('express');
const { body, param } = require('express-validator');
const pledgeController = require('../controllers/pledgeController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');

const router = express.Router();

// Validation for creating a pledge
const createPledgeValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Pledge amount is required')
    .isInt({ min: 1 })
    .withMessage('Pledge amount must be an integer greater than or equal to 1'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Pledge purpose is required')
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters')
];

// All pledge routes require authentication
router.use(protect);

// GET /api/pledges - Both roles (Donor sees own, Admin sees all)
router.get('/', pledgeController.getPledges);

// GET /api/pledges/:id - Both roles (Donor verified for ownership)
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid pledge ID format')
  ],
  pledgeController.getPledgeById
);

// POST /api/pledges - Donor only (Admin cannot create pledges)
router.post('/', restrictTo('donor'), createPledgeValidation, pledgeController.createPledge);

module.exports = router;