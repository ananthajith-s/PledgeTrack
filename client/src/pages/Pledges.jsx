import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatINR } from '../utils/formatCurrency';
import { PaymentHistoryModal } from '../components/PaymentHistoryModal';

export const Pledges = () => {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeHistoryPledge, setActiveHistoryPledge] = useState(null);

  const fetchOwnPledges = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/pledges');
      setPledges(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to load your pledges'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnPledges();
  }, []);

  const totalPledged = pledges.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPaid = pledges.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
  const totalRemaining = Math.max(0, totalPledged - totalPaid);

  return (
    <div className="pledges-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Pledges</h1>
          <p className="page-subtitle">
            View your personal pledge commitments and track verification of payments made.
          </p>
        </div>
        <Link to="/pledges/new" className="btn btn-primary" id="btn-create-pledge">
          + Make a New Pledge
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <div>{error}</div>
        </div>
      )}

      {/* Donor Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-pledged">
          <div className="metric-header">
            <span className="metric-title">My Total Pledged</span>
          </div>
          <div className="metric-value">{formatINR(totalPledged)}</div>
          <div className="metric-footer">{pledges.length} total pledges made</div>
        </div>

        <div className="metric-card metric-collected">
          <div className="metric-header">
            <span className="metric-title">Fulfilled So Far</span>
          </div>
          <div className="metric-value text-success">{formatINR(totalPaid)}</div>
          <div className="metric-footer">
            {totalPledged > 0
              ? `${Math.round((totalPaid / totalPledged) * 100)}% overall progress`
              : '0% progress'}
          </div>
        </div>

        <div className="metric-card metric-pending">
          <div className="metric-header">
            <span className="metric-title">Outstanding Balance</span>
          </div>
          <div className="metric-value text-warning">{formatINR(totalRemaining)}</div>
          <div className="metric-footer">Awaiting admin payment confirmation</div>
        </div>
      </div>

      {/* Pledges List */}
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Your Pledge History</h2>
            <p className="section-subtitle">
              Pledges update automatically as the administrator records and verifies your payments.
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchOwnPledges} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Loading your pledges...</p>
          </div>
        ) : pledges.length === 0 ? (
          <div className="empty-state">
            <h3>No pledges created yet</h3>
            <p>You haven't made any pledges yet. Click below to submit your first pledge!</p>
            <Link to="/pledges/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Your First Pledge
            </Link>
          </div>
        ) : (
          <div className="pledge-cards-grid">
            {pledges.map((p) => {
              const progressPct =
                p.amount > 0 ? Math.min(100, Math.round(((p.paidAmount || 0) / p.amount) * 100)) : 0;
              return (
                <div key={p._id} className="pledge-card">
                  <div className="pledge-card-header">
                    <span className={`status-badge status-${p.status}`}>{p.status}</span>
                    <span className="pledge-date">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="pledge-purpose">{p.purpose}</h3>

                  <div className="progress-section">
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill fill-${p.status}`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <div className="progress-labels">
                      <span>{progressPct}% Completed</span>
                      <span>
                        Paid: {formatINR(p.paidAmount)} / {formatINR(p.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="pledge-card-details">
                    <div className="detail-item">
                      <span className="detail-label">Pledged Amount:</span>
                      <span className="detail-val font-medium">{formatINR(p.amount)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Remaining Balance:</span>
                      <span className="detail-val font-bold text-warning">
                        {formatINR(p.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="pledge-card-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-block"
                      onClick={() => setActiveHistoryPledge(p)}
                    >
                      View Verified Payments ({p.paidAmount > 0 ? 'Recorded' : 'None yet'})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

export default Pledges;