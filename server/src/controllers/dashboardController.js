const Pledge = require('../models/Pledge');
const Payment = require('../models/Payment');

/**
 * @desc    Get dashboard summary metrics using MongoDB aggregation
 * @route   GET /api/dashboard/summary
 * @access  Private (Admin only)
 */
exports.getSummary = async (req, res, next) => {
  try {
    // 1. Aggregate pledge metrics and status counts
    const pledgeMetricsPromise = Pledge.aggregate([
      {
        $group: {
          _id: null,
          totalPledged: { $sum: '$amount' },
          totalPledgesCount: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          partialCount: {
            $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
          },
          fulfilledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
          }
        }
      }
    ]);

    // 2. Aggregate total paid directly from payments collection (Source of Truth)
    const paymentMetricsPromise = Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          totalPaymentsCount: { $sum: 1 }
        }
      }
    ]);

    const [pledgeMetrics, paymentMetrics] = await Promise.all([
      pledgeMetricsPromise,
      paymentMetricsPromise
    ]);

    const pMetric = pledgeMetrics[0] || {
      totalPledged: 0,
      totalPledgesCount: 0,
      pendingCount: 0,
      partialCount: 0,
      fulfilledCount: 0
    };

    const payMetric = paymentMetrics[0] || {
      totalPaid: 0,
      totalPaymentsCount: 0
    };

    const totalPledged = pMetric.totalPledged;
    const totalPaid = payMetric.totalPaid;
    const totalPending = Math.max(0, totalPledged - totalPaid);

    res.status(200).json({
      success: true,
      data: {
        totalPledged,
        totalPaid,
        totalPending,
        currency: 'INR',
        currencySymbol: '₹',
        counts: {
          total: pMetric.totalPledgesCount,
          pending: pMetric.pendingCount,
          partial: pMetric.partialCount,
          fulfilled: pMetric.fulfilledCount,
          payments: payMetric.totalPaymentsCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};