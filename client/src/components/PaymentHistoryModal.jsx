import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatINR } from '../utils/formatCurrency';

export const PaymentHistoryModal = ({ pledge, isOpen, onClose }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !pledge) return;

    const fetchPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/payments/pledge/${pledge._id}`);
        setPayments(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to load payment history'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isOpen, pledge]);

  if (!isOpen || !pledge) return null;

  const totalPaidSum = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Payment Installment History</h3>
            <p className="modal-subtitle">
              Pledge for &ldquo;{pledge.purpose}&rdquo; &bull; Total: {formatINR(pledge.amount)}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="pledge-status-strip">
          <div className="status-item">
            <span>Pledged:</span> <strong>{formatINR(pledge.amount)}</strong>
          </div>
          <div className="status-item">
            <span>Total Collected:</span> <strong>{formatINR(totalPaidSum)}</strong>
          </div>
          <div className="status-item">
            <span>Remaining:</span>{' '}
            <strong className="text-warning">
              {formatINR(Math.max(0, pledge.amount - totalPaidSum))}
            </strong>
          </div>
          <div className="status-item">
            <span>Status:</span>{' '}
            <span className={`status-badge status-${pledge.status}`}>
              {pledge.status}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Loading installment records...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <div>{error}</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <h4>No payments recorded yet</h4>
            <p>When the admin records payments for this pledge, installments will appear here.</p>
          </div>
        ) : (
          <div className="table-responsive history-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date Paid</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Ref Number</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {new Date(p.paidOn || p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="font-bold text-success">{formatINR(p.amount)}</td>
                    <td>
                      <span className="badge-method">{p.paymentMethod?.replace('_', ' ')}</span>
                    </td>
                    <td className="text-mono">{p.referenceNumber || '—'}</td>
                    <td>{p.recordedBy?.name || 'Admin'}</td>
                    <td className="text-muted">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
