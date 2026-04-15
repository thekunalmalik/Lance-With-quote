import React, { useState, useMemo } from 'react';
import Web3 from 'web3';
import './QuotationCard.css';

// Helper function to calculate difference between two wei amounts
// eslint-disable-next-line no-undef
const calculateDifference = (proposed, original) => {
  try {
    // Convert both to strings
    const propStr = String(proposed);
    const origStr = String(original);
    
    // Handle scientific notation
    const formatNum = (str) => {
      const num = Number(str);
      return num.toLocaleString('en-US', { 
        useGrouping: false,
        maximumFractionDigits: 0
      }).replace(/,/g, '');
    };
    
    // eslint-disable-next-line no-undef
    const propNum = BigInt(formatNum(propStr));
    // eslint-disable-next-line no-undef
    const origNum = BigInt(formatNum(origStr));
    const diff = propNum - origNum;
    
    const web3 = new Web3();
    return web3.utils.fromWei(diff.toString(), 'ether');
  } catch (error) {
    console.error('Error calculating difference:', error);
    return '0';
  }
};
const convertToEth = (value) => {
  try {
    if (!value) return '0';
    
    // Convert to string if it's a number, removing scientific notation
    let strValue = String(value);
    
    // If it's in scientific notation, use toLocaleString to convert it
    if (strValue.includes('e') || strValue.includes('E')) {
      try {
        // Parse as number and convert without scientific notation
        const num = Number(value);
        strValue = num.toLocaleString('en-US', { 
          useGrouping: false,
          maximumFractionDigits: 0
        }).replace(/,/g, '');
      } catch {
        return '0';
      }
    }
    
    const web3 = new Web3();
    return web3.utils.fromWei(strValue, 'ether');
  } catch (error) {
    console.error('Error converting to ETH:', error, 'value:', value);
    return '0';
  }
};

const QuotationCard = ({
  quotation,
  quotationIndex,
  projectId,
  projectReward,
  onAccept,
  onReject,
  selectedAccount
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const statusNames = ['Pending', 'Proposed', 'Negotiating', 'Accepted', 'Rejected'];
  const statusClass = statusNames[quotation.status]?.toLowerCase() || 'pending';

  const proposedAmountEth = useMemo(() => convertToEth(quotation.proposedAmount), [quotation.proposedAmount]);

  const handleAcceptClick = async () => {
    if (!window.confirm(`Accept this quotation for ${proposedAmountEth} ETH?`)) {
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);
      setSuccess(null);

      await onAccept(projectId, quotationIndex, quotation.proposedAmount);
      setSuccess('Quotation accepted successfully! Escrow created.');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error accepting quotation:', err);
      setError(`Failed to accept quotation: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRejectClick = async () => {
    if (!window.confirm('Reject this quotation?')) {
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);
      setSuccess(null);

      await onReject(projectId, quotationIndex);
      setSuccess('Quotation rejected.');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting quotation:', err);
      setError(`Failed to reject quotation: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const canAccept = Number(quotation.status) === 0 || Number(quotation.status) === 1 || Number(quotation.status) === 2; // Pending, Proposed, or Negotiating
  const canReject = Number(quotation.status) === 0 || Number(quotation.status) === 1 || Number(quotation.status) === 2; // Pending, Proposed, or Negotiating

  return (
    <div className={`quotation-card status-${statusClass}`}>
      <div className="quotation-header">
        <div className="quotation-from">
          <span className="badge freelancer-badge">👤 Freelancer</span>
          <span className="freelancer-address">{quotation.proposedBy}</span>
        </div>
        <div className="quotation-status">
          <span className={`status-badge status-${statusClass}`}>
            {statusNames[quotation.status]}
          </span>
        </div>
      </div>

      <div className="quotation-amount">
        <span className="label">Proposed Amount:</span>
        <span className="amount">{proposedAmountEth} ETH</span>
        {quotation.proposedAmount !== projectReward && (
          <span className="difference">
            ({calculateDifference(quotation.proposedAmount, projectReward) > 0 ? '+' : ''}
            {calculateDifference(quotation.proposedAmount, projectReward)} ETH vs original)
          </span>
        )}
      </div>

      <div className="quotation-description">
        <span className="label">Description:</span>
        <p>{quotation.description || 'No description provided'}</p>
      </div>

      {quotation.negotiationNotes && (
        <div className="quotation-notes">
          <span className="label">Negotiation Notes:</span>
          <p>{quotation.negotiationNotes}</p>
        </div>
      )}

      <div className="quotation-timestamp">
        <small>
          Submitted: {new Date(parseInt(quotation.timestamp) * 1000).toLocaleString()}
        </small>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="quotation-actions">
        {canAccept && (
          <button 
            className="btn btn-accept"
            onClick={handleAcceptClick}
            disabled={isConfirming}
          >
            {isConfirming ? '⏳ Processing...' : '✓ Accept & Create Escrow'}
          </button>
        )}
        
        {canReject && (
          <button 
            className="btn btn-reject"
            onClick={handleRejectClick}
            disabled={isConfirming}
          >
            {isConfirming ? '⏳ Processing...' : '✗ Reject'}
          </button>
        )}

        {Number(quotation.status) === 3 && (
          <div className="quotation-accepted-message">
            ✓ This quotation has been accepted. Project is now assigned.
          </div>
        )}

        {Number(quotation.status) === 4 && (
          <div className="quotation-rejected-message">
            ✗ This quotation has been rejected.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationCard;
