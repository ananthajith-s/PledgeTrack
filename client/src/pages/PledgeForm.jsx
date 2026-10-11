import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { formatINR } from '../utils/formatCurrency';

export const PledgeForm = () => {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const numAmount = parseInt(amount, 10) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (numAmount <= 0) {
      setError('Please specify a pledge amount of at least ₹1');
      return;
    }

    if (!purpose.trim()) {
      setError('Please provide a purpose or note for your pledge');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/pledges', {
        amount: numAmount,
        purpose: purpose.trim()
      });
      // Navigate back to pledges on success
      navigate('/pledges');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create pledge. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickAmount = (val) => {
    setAmount(String(val));
    setError('');
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <div className="form-header">
          <Link to="/pledges" className="back-link">
            &larr; Back to My Pledges
          </Link>
          <h1 className="page-title">Create a New Pledge</h1>
          <p className="page-subtitle">
            Commit an institutional or personal contribution in INR. The pledge status will start as &ldquo;pending&rdquo; until payment installments are recorded.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="standard-form">
          <div className="form-group">
            <label htmlFor="pledge-amount">
              Pledge Amount (INR - ₹) <span className="required">*</span>
            </label>
            <div className="input-prefix-container">
              <span className="input-currency-prefix">₹</span>
              <input
                id="pledge-amount"
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 5000"
                value={amount}
                disabled={isSubmitting}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
              />
            </div>

            {/* Quick preset chips */}
            <div className="quick-amount-buttons">
              {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn-quick ${numAmount === preset ? 'active' : ''}`}
                  onClick={() => handleSelectQuickAmount(preset)}
                  disabled={isSubmitting}
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pledge-purpose">
              Pledge Purpose / Project <span className="required">*</span>
            </label>
            <textarea
              id="pledge-purpose"
              rows={4}
              required
              placeholder="e.g. Annual scholarship fund for underprivileged students, library building construction, etc."
              value={purpose}
              disabled={isSubmitting}
              onChange={(e) => setPurpose(e.target.value)}
              maxLength={500}
            />
            <span className="field-hint">
              {purpose.length}/500 characters
            </span>
          </div>

          <div className="pledge-preview-notice">
            <div className="notice-text">
              <strong>What happens next?</strong>
              <p>
                Your pledge of {numAmount > 0 ? formatINR(numAmount) : '₹—'} will be recorded with <strong>pending</strong> status. Once you transfer the funds, our administrator will verify and record installments against your pledge.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/pledges" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              id="submit-pledge-btn"
              className="btn btn-primary"
              disabled={isSubmitting || numAmount <= 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span> Creating Pledge...
                </>
              ) : (
                `Confirm Pledge (${numAmount > 0 ? formatINR(numAmount) : '₹0'})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PledgeForm;