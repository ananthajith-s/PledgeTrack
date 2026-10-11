import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatINR } from '../utils/formatCurrency';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { PaymentHistoryModal } from '../components/PaymentHistoryModal';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [activePaymentPledge, setActivePaymentPledge] = useState(null);
  const [activeHistoryPledge, setActiveHistoryPledge] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, pledgesRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/pledges${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)
      ]);
      setSummary(summaryRes.data.data);
      setPledges(pledgesRes.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to fetch dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePaymentSuccess = (paymentData) => {
    // Update local pledge in state
    if (paymentData?.pledge) {
      setPledges((prev) =>
        prev.map((p) =>
          p._id === paymentData.pledge._id
            ? { ...p, ...paymentData.pledge }
            : p
        )
      );
    }
    // Refresh summary metrics to update totals and counts
    api.get('/dashboard/summary').then((res) => {
      setSummary(res.data.data);
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Monitor institutional pledges, track collections, and record installment payments in INR.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-refresh"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <div>{error}</div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="metrics-grid">
          <div className="metric-card metric-pledged">
            <div className="metric-header">
              <span className="metric-title">Total Pledged</span>
            </div>
            <div className="metric-value">{formatINR(summary.totalPledged)}</div>
            <div className="metric-footer">
              Across {summary.counts?.total || 0} total pledges
            </div>
          </div>

          <div className="metric-card metric-collected">
            <div className="metric-header">
              <span className="metric-title">Total Collected</span>
            </div>
            <div className="metric-value text-success">{formatINR(summary.totalPaid)}</div>
            <div className="metric-footer">
              {summary.counts?.payments || 0} installments processed
            </div>
          </div>

          <div className="metric-card metric-pending">
            <div className="metric-header">
              <span className="metric-title">Total Pending</span>
            </div>
            <div className="metric-value text-warning">{formatINR(summary.totalPending)}</div>
            <div className="metric-footer">
              {summary.counts?.partial || 0} partial &bull; {summary.counts?.pending || 0} awaiting
            </div>
          </div>

          <div className="metric-card metric-breakdown">
            <div className="metric-header">
              <span className="metric-title">Pledge Status Breakdown</span>
            </div>
            <div className="breakdown-chips">
              <span className="status-badge status-pending">
                {summary.counts?.pending || 0} Pending
              </span>
              <span className="status-badge status-partial">
                {summary.counts?.partial || 0} Partial
              </span>
              <span className="status-badge status-fulfilled">
                {summary.counts?.fulfilled || 0} Fulfilled
              </span>
            </div>
            <div className="metric-footer">
              {summary.counts?.fulfilled || 0} completely fulfilled
            </div>
          </div>
        </div>
      )}

      {/* Pledges Management Section */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">All Pledges</h2>
            <p className="section-subtitle">
              Filter by status and record incoming payments directly into each pledge ledger.
            </p>
          </div>

          <div className="filter-group">
            <span className="filter-label">Filter:</span>
            {['all', 'pending', 'partial', 'fulfilled'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Loading pledges database...</p>
          </div>
        ) : pledges.length === 0 ? (
          <div className="empty-state">
            <h3>No pledges found</h3>
            <p>
              {statusFilter !== 'all'
                ? `There are no pledges with status "${statusFilter}".`
                : 'No pledges have been submitted by donors yet.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Purpose</th>
                  <th>Pledged</th>
                  <th>Paid So Far</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pledges.map((p) => {
                  const isFulfilled = p.status === 'fulfilled' || p.remainingAmount <= 0;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="donor-cell">
                          <span className="donor-name">{p.donor?.name || 'Anonymous Donor'}</span>
                          <span className="donor-email">{p.donor?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="purpose-cell" title={p.purpose}>
                        {p.purpose}
                      </td>
                      <td className="font-medium">{formatINR(p.amount)}</td>
                      <td className="font-bold text-success">{formatINR(p.paidAmount)}</td>
                      <td className="font-medium text-warning">
                        {formatINR(p.remainingAmount)}
                      </td>
                      <td>
                        <span className={`status-badge status-${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => setActiveHistoryPledge(p)}
                            title="View installment history"
                          >
                            History
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={isFulfilled}
                            onClick={() => setActivePaymentPledge(p)}
                            title={
                              isFulfilled
                                ? 'Pledge is already fully paid'
                                : 'Record payment installment'
                            }
                          >
                            {isFulfilled ? 'Fulfilled' : '+ Record Payment'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {activePaymentPledge && (
        <RecordPaymentModal
          pledge={activePaymentPledge}
          isOpen={!!activePaymentPledge}
          onClose={() => setActivePaymentPledge(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment History Modal */}
      {activeHistoryPledge && (
        <PaymentHistoryModal
          pledge={activeHistoryPledge}
          isOpen={!!activeHistoryPledge}
          onClose={() => setActiveHistoryPledge(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;