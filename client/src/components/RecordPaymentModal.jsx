import React, { useState } from 'react';
import api from '../api/axios';
import { formatINR } from '../utils/formatCurrency';

export const RecordPaymentModal = ({ pledge, isOpen, onClose, onPaymentSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !pledge) return null;

  const remaining = pledge.remainingAmount;
  const numAmount = parseInt(amount, 10) || 0;
  const isOverpaid = numAmount > remaining;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks

    if (numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₹0');
      return;
    }

    if (numAmount > remaining) {
      setErrorMessage(
        `Payment amount (${formatINR(numAmount)}) exceeds the remaining balance (${formatINR(remaining)})`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await api.post('/payments', {
        pledgeId: pledge._id,
        amount: numAmount,
        paymentMethod,
        referenceNumber,
        notes
      });

      // Clear form state
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      setErrorMessage('');

      if (onPaymentSuccess) {
        onPaymentSuccess(response.data.data);
      }
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to record payment. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetQuickAmount = (val) => {
    setAmount(String(val));
    setErrorMessage('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Record Payment</h3>
          <button className="btn-close" onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <div>{errorMessage}</div>
          </div>
        )}

        <div className="pledge-summary-box">
          <div className="summary-row">
            <span className="summary-label">Donor:</span>
            <span className="summary-value font-medium">
              {pledge.donor?.name || 'Anonymous'} ({pledge.donor?.email || 'N/A'})
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Purpose:</span>
            <span className="summary-value">{pledge.purpose}</span>
          </div>
          <div className="summary-stats-grid">
            <div className="stat-card stat-total">
              <span className="stat-label">Total Pledged</span>
              <span className="stat-number">{formatINR(pledge.amount)}</span>
            </div>
            <div className="stat-card stat-paid">
              <span className="stat-label">Already Paid</span>
              <span className="stat-number">{formatINR(pledge.paidAmount)}</span>
            </div>
            <div className="stat-card stat-remaining">
              <span className="stat-label">Remaining Balance</span>
              <span className="stat-number font-bold">{formatINR(remaining)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="payment-amount">
              Payment Amount (INR - ₹) <span className="required">*</span>
            </label>
            <div className="input-prefix-container">
              <span className="input-currency-prefix">₹</span>
              <input
                id="payment-amount"
                type="number"
                min="1"
                max={remaining}
                step="1"
                required
                value={amount}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMessage('');
                }}
                placeholder={`Max ${remaining}`}
                className={isOverpaid ? 'input-error' : ''}
              />
            </div>
            {isOverpaid && (
              <span className="field-hint error">
                Cannot exceed remaining balance of {formatINR(remaining)}
              </span>
            )}
            {remaining > 0 && (
              <div className="quick-amount-buttons">
                <button
                  type="button"
                  className="btn-quick"
                  onClick={() => handleSetQuickAmount(remaining)}
                  disabled={isSubmitting}
                >
                  Pay Full Balance ({formatINR(remaining)})
                </button>
                {remaining >= 2000 && (
                  <button
                    type="button"
                    className="btn-quick"
                    onClick={() => handleSetQuickAmount(Math.floor(remaining / 2))}
                    disabled={isSubmitting}
                  >
                    Pay 50% ({formatINR(Math.floor(remaining / 2))})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="payment-method">Payment Method</label>
            <select
              id="payment-method"
              value={paymentMethod}
              disabled={isSubmitting}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
              <option value="online">Online / UPI / QR</option>
              <option value="credit_card">Credit / Debit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reference-number">Transaction / Reference Number (optional)</label>
            <input
              id="reference-number"
              type="text"
              placeholder="e.g. UPI-92817294 or TXN-49102"
              value={referenceNumber}
              disabled={isSubmitting}
              onChange={(e) => setReferenceNumber(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="payment-notes">Internal Notes (optional)</label>
            <textarea
              id="payment-notes"
              rows={2}
              placeholder="Cheque cleared, verified by finance, etc."
              value={notes}
              disabled={isSubmitting}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isOverpaid || numAmount <= 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span> Recording Payment...
                </>
              ) : (
                `Record Payment (${formatINR(numAmount)})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
