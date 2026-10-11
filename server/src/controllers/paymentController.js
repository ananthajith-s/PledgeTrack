const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Pledge = require('../models/Pledge');

// Helper to format currency in INR for clear error messages
const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

/**
 * @desc    Record a new payment for a pledge
 * @route   POST /api/payments
 * @access  Private (Admin only)
 */
exports.recordPayment = async (req, res, next) => {
  try {
    // 1. Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
    }

    const { pledgeId, pledge: pledgeBodyId, amount, paymentMethod, referenceNumber, notes, paidOn } = req.body;
    const targetPledgeId = pledgeId || pledgeBodyId;

    if (!targetPledgeId) {
      const error = new Error('Pledge ID is required');
      error.statusCode = 400;
      throw error;
    }

    const paymentAmount = parseInt(amount, 10);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      const error = new Error('Payment amount must be a positive integer');
      error.statusCode = 400;
      throw error;
    }

    // 2. Check that the pledge exists
    const pledge = await Pledge.findById(targetPledgeId);
    if (!pledge) {
      const error = new Error('Pledge not found');
      error.statusCode = 404;
      throw error;
    }

    // 3. Reject if pledge is already fulfilled
    if (pledge.status === 'fulfilled') {
      const error = new Error('Pledge is already fulfilled and cannot accept additional payments');
      error.statusCode = 400;
      throw error;
    }

    // 4. Recalculate total paid so far from the payments collection (Source of Truth)
    const existingAgg = await Payment.aggregate([
      { $match: { pledge: pledge._id } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } }
    ]);
    const currentPaid = existingAgg.length > 0 ? existingAgg[0].totalPaid : 0;
    const remainingBalance = pledge.amount - currentPaid;

    // 5. Check for overpayment against remaining balance
    if (paymentAmount > remainingBalance) {
      const error = new Error(
        `Payment amount of ${formatINR(paymentAmount)} exceeds remaining balance of ${formatINR(remainingBalance)}`
      );
      error.statusCode = 400;
      throw error;
    }

    // 6. Save the payment with recordedBy set to admin ID
    const payment = await Payment.create({
      pledge: pledge._id,
      amount: paymentAmount,
      recordedBy: req.user.id,
      paymentMethod: paymentMethod || 'cash',
      referenceNumber: referenceNumber || '',
      notes: notes || '',
      paidOn: paidOn ? new Date(paidOn) : new Date()
    });

    // 7. Post-Insert Verification (Approach B: Concurrency guard & rollback on standalone MongoDB)
    const postAgg = await Payment.aggregate([
      { $match: { pledge: pledge._id } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } }
    ]);
    const newTotalPaid = postAgg.length > 0 ? postAgg[0].totalPaid : 0;

    if (newTotalPaid > pledge.amount) {
      // Race condition detected! Another transaction committed concurrently.
      // Rollback the newly created payment document.
      await Payment.findByIdAndDelete(payment._id);
      const error = new Error(
        'Payment conflict: Total would exceed pledge amount due to a concurrent payment. Please refresh and try again.'
      );
      error.statusCode = 400;
      throw error;
    }

    // 8. Determine pledge status according to core status rules:
    // 0 -> pending
    // >0 and <pledge.amount -> partial
    // ==pledge.amount -> fulfilled
    let newStatus = 'pending';
    if (newTotalPaid >= pledge.amount) {
      newStatus = 'fulfilled';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial';
    }

    const newRemaining = Math.max(0, pledge.amount - newTotalPaid);

    pledge.paidAmount = newTotalPaid;
    pledge.remainingAmount = newRemaining;
    pledge.status = newStatus;
    await pledge.save();

    // Populate recordedBy for response
    await payment.populate('recordedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        pledge: {
          _id: pledge._id,
          amount: pledge.amount,
          paidAmount: pledge.paidAmount,
          remainingAmount: pledge.remainingAmount,
          status: pledge.status,
          purpose: pledge.purpose,
          donor: pledge.donor
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history for a specific pledge
 * @route   GET /api/payments/pledge/:pledgeId
 * @access  Private (Admin can see all; Donor can see only own pledges)
 */
exports.getPaymentsByPledgeId = async (req, res, next) => {
  try {
    const { pledgeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pledgeId)) {
      const error = new Error('Invalid pledge ID format');
      error.statusCode = 400;
      throw error;
    }

    const pledge = await Pledge.findById(pledgeId);
    if (!pledge) {
      const error = new Error('Pledge not found');
      error.statusCode = 404;
      throw error;
    }

    // Authorization check: If donor, ensure they own the pledge
    if (req.user.role === 'donor' && pledge.donor.toString() !== req.user.id.toString()) {
      const error = new Error('You do not have permission to view payments for this pledge');
      error.statusCode = 403;
      throw error;
    }

    const payments = await Payment.find({ pledge: pledgeId })
      .populate('recordedBy', 'name email')
      .sort({ paidOn: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments (Admin audit ledger)
 * @route   GET /api/payments
 * @access  Private (Admin only)
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('pledge', 'amount purpose status donor')
      .populate('recordedBy', 'name email')
      .sort({ paidOn: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};