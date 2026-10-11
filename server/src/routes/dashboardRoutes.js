const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');

const router = express.Router();

// Dashboard is restricted to Admin only
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/dashboard/summary - MongoDB aggregation summary
router.get('/summary', dashboardController.getSummary);

module.exports = router;