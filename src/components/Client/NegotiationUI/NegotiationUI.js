import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { getQuotations, counterPropose, acceptQuotation, rejectQuotation } from '../../../services/web3';
import './NegotiationUI.css';

const NegotiationUI = ({ projectId, projectReward, freelancerAddress, employer, onQuotationUpdate }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const web3 = new Web3();

  const statusNames = ['Pending', 'Proposed', 'Negotiating', 'Accepted', 'Rejected'];

  useEffect(() => {
    fetchQuotations();
  }, [projectId]);

  const fetchQuotations = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getQuotations(projectId);
      setQuotations(result);
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterPropose = async () => {
    if (!counterAmount || counterAmount <= 0) {
      setError('Please enter a valid counter amount');
      return;
    }

    if (!counterNotes || counterNotes.trim() === '') {
      setError('Please provide notes for your counter-proposal');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const amountInWei = web3.utils.toWei(counterAmount.toString(), 'ether');
      await counterPropose(projectId, amountInWei, counterNotes, employer);
      setSuccess('Counter-proposal sent successfully!');
      setShowCounterForm(false);
      setCounterAmount('');
      setCounterNotes('');
      setTimeout(() => {
        fetchQuotations();
        if (onQuotationUpdate) onQuotationUpdate();
      }, 1500);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuotation = async (index, amount) => {
    if (!window.confirm('Accept this quotation and create escrow?')) return;

    setSubmitting(true);
    setError('');

    try {
      await acceptQuotation(projectId, index, amount, employer);
      setSuccess('Quotation accepted! Project is now assigned.');
      setTimeout(() => {
        if (onQuotationUpdate) onQuotationUpdate();
      }, 1500);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectQuotation = async (index) => {
    if (!window.confirm('Reject this quotation?')) return;

    setSubmitting(true);
    setError('');

    try {
      await rejectQuotation(projectId, index, employer);
      setSuccess('Quotation rejected. Freelancer can submit another.');
      setTimeout(() => fetchQuotations(), 1500);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="negotiation-loading">Loading quotations...</div>;

  if (quotations.length === 0) {
    return (
      <div className="negotiation-container">
        <p className="no-quotations">No quotations yet. Waiting for freelancer to propose...</p>
      </div>
    );
  }

  const latestQuotation = quotations[quotations.length - 1];
  const isNegotiating = latestQuotation.status === '2';

  return (
    <div className="negotiation-container">
      <h4>Quotation & Negotiation</h4>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="quotation-history">
        {quotations.map((quote, index) => (
          <div key={index} className={`quotation-card status-${quote.status}`}>
            <div className="quotation-header">
              <span className="proposed-by">
                {quote.proposedBy === freelancerAddress ? '👤 Freelancer' : '👔 You (Employer)'}
              </span>
              <span className={`status-badge status-${quote.status}`}>
                {statusNames[quote.status] || 'Unknown'}
              </span>
            </div>

            <div className="quotation-amount">
              <span className="amount">{web3.utils.fromWei(quote.proposedAmount, 'ether') || quote.proposedAmount} ETH</span>
              {quote.proposedAmount < projectReward && (
                <span className="amount-indicator">💚 Below Budget</span>
              )}
              {quote.proposedAmount > projectReward && (
                <span className="amount-indicator">⚠️ Above Budget</span>
              )}
            </div>

            <p className="quotation-description">{quote.description}</p>

            {quote.negotiationNotes && (
              <div className="negotiation-notes">
                <strong>Counter Offer Notes:</strong>
                <p>{quote.negotiationNotes}</p>
              </div>
            )}

            {index === quotations.length - 1 && quote.status !== '3' && quote.status !== '4' && (
              <div className="quotation-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleAcceptQuotation(index, quote.proposedAmount)}
                  disabled={submitting}
                >
                  ✓ Accept
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setShowCounterForm(!showCounterForm);
                    setCounterAmount(quote.proposedAmount);
                  }}
                  disabled={submitting}
                >
                  🔄 Counter Offer
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRejectQuotation(index)}
                  disabled={submitting}
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCounterForm && (
        <div className="counter-form">
          <h5>Send Counter Proposal</h5>
          <div className="form-group">
            <label>Your Offer Amount (ETH)</label>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              step="0.01"
              min="0"
              disabled={submitting}
              placeholder="Enter counter offer amount"
            />
          </div>

          <div className="form-group">
            <label>Explanation / Notes</label>
            <textarea
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
              placeholder="Explain your counter-proposal..."
              rows="3"
              disabled={submitting}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleCounterPropose}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send Counter Proposal'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCounterForm(false)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NegotiationUI;
