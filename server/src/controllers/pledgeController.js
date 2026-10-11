const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Pledge = require('../models/Pledge');

/**
 * @desc    Get pledges (Admins get all with donor details; Donors get only their own)
 * @route   GET /api/pledges
 * @access  Private
 */
exports.getPledges = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};

    // Donors can ONLY see their own pledges
    if (req.user.role === 'donor') {
      query.donor = req.user.id;
    }

    // Optional status filter (pending, partial, fulfilled)
    if (status && ['pending', 'partial', 'fulfilled'].includes(status)) {
      query.status = status;
    }

    let pledgeQuery = Pledge.find(query).sort({ createdAt: -1 });

    // Populate donor info for admin (and available for donor too)
    pledgeQuery = pledgeQuery.populate('donor', 'name email');

    const pledges = await pledgeQuery;

    res.status(200).json({
      success: true,
      count: pledges.length,
      data: pledges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single pledge by ID
 * @route   GET /api/pledges/:id
 * @access  Private (Admins can view any; Donors can view only own)
 */
exports.getPledgeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid pledge ID format');
      error.statusCode = 400;
      throw error;
    }

    const pledge = await Pledge.findById(id).populate('donor', 'name email');
    if (!pledge) {
      const error = new Error('Pledge not found');
      error.statusCode = 404;
      throw error;
    }

    // Check ownership for donor
    if (req.user.role === 'donor' && pledge.donor._id.toString() !== req.user.id.toString()) {
      const error = new Error('You do not have permission to view this pledge');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: pledge
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new pledge
 * @route   POST /api/pledges
 * @access  Private (Donor only)
 */
exports.createPledge = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.errors = errors.array();
      throw error;
    }

    const { amount, purpose } = req.body;
    const pledgeAmount = parseInt(amount, 10);

    if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
      const error = new Error('Pledge amount must be a positive integer');
      error.statusCode = 400;
      throw error;
    }

    // Donor is ALWAYS set from the token (req.user.id), NEVER from the form body
    const pledge = await Pledge.create({
      donor: req.user.id,
      amount: pledgeAmount,
      purpose,
      status: 'pending',
      paidAmount: 0,
      remainingAmount: pledgeAmount
    });

    await pledge.populate('donor', 'name email');

    res.status(201).json({
      success: true,
      message: 'Pledge created successfully',
      data: pledge
    });
  } catch (error) {
    next(error);
  }
};