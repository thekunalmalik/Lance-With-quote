// src/components/Client/RequestCard/RequestCard.js
import React, { useState } from 'react';
import { acceptRequest, rejectRequest } from '../../../../services/web3';
import NegotiationUI from '../../NegotiationUI/NegotiationUI';
import './RequestCard.css';

function RequestCard({ request, employer, projectReward, projectId }) {
  const { requestId, projectId: reqProjectId, freelancer, freelancerRating, status } = request;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNegotiation, setShowNegotiation] = useState(false);

  const statusNames = ['Pending', 'Accepted', 'Rejected'];
  const statusDisplay = statusNames[parseInt(status)] || 'Unknown';

  const handleAcceptRequest = async () => {
    if (!window.confirm('Accept this request?')) return;
    setIsProcessing(true);
    setError('');
    try {
      await acceptRequest(requestId, employer, projectReward, projectId);
      setSuccess('Request accepted and escrow created!');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!window.confirm('Reject this request?')) return;
    setIsProcessing(true);
    setError('');
    try {
      await rejectRequest(requestId, employer);
      setSuccess('Request rejected.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="request-card">
      <div className="request-header">
        <h4>Request from {freelancer.slice(0, 6)}...{freelancer.slice(-4)}</h4>
        <span className={`status-badge status-${status}`}>{statusDisplay}</span>
      </div>

      <div className="request-details">
        <p><strong>Freelancer Rating:</strong> {freelancerRating || 'N/A'} / 5</p>
        <p><strong>Project ID:</strong> {reqProjectId}</p>
        <p><strong>Budget:</strong> {projectReward} ETH</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Negotiation UI - Show when status is Pending */}
      {status === '0' && (
        <div className="request-actions">
          <button 
            className="btn btn-toggle-negotiation"
            onClick={() => setShowNegotiation(!showNegotiation)}
          >
            {showNegotiation ? '▼ Hide Quotation Details' : '▶ View Quotation & Negotiate'}
          </button>

          {showNegotiation && (
            <NegotiationUI 
              projectId={reqProjectId}
              projectReward={projectReward}
              freelancerAddress={freelancer}
              employer={employer}
              onQuotationUpdate={() => window.location.reload()}
            />
          )}

          <div className="request-decision-buttons">
            <button 
              className="btn btn-accept"
              onClick={handleAcceptRequest}
              disabled={isProcessing}
            >
              ✓ Accept (Original Budget)
            </button>
            <button 
              className="btn btn-reject"
              onClick={handleRejectRequest}
              disabled={isProcessing}
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}

      {status !== '0' && (
        <div className="request-info">
          <p className="info-text">
            {status === '1' ? '✓ This request has been accepted.' : '✗ This request was rejected.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default RequestCard;
