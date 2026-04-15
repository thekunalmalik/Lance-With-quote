// src/components/Client/ProjectCard.js
import React, { useState } from 'react';
import { addMilestone, getMilestones, getQuotations, acceptQuotation, rejectQuotation } from '../../../../services/web3';
import MilestoneCard from '../MilestoneCard/MilestoneCard';
import Web3 from 'web3';
import './ProjectCard.css';

// Helper function to safely convert large numbers to ETH
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

function ProjectCard({ title, description, reward, status, employer, projectId, selectedAccount, onQuotationAccepted }) {
  console.log("ProjectCard");
  console.log(typeof(projectId));
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDayCount, setMilestoneDayCount] = useState('');
  const [milestonePercentage, setMilestonePercentage] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showRequests, setShowRequests] = useState(false); // Legacy requests - deprecated
  const [quotations, setQuotations] = useState([]);
  const [showQuotations, setShowQuotations] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [processingQuotation, setProcessingQuotation] = useState(null);

  // Map status: 0 = Closed/Processed, 1 = Open
  const getStatusLabel = () => {
    return status === '0' ? 'Processed' : 'Open';
  };

  const getStatusClass = () => {
    return status === '0' ? 'processed' : 'open';
  };

  const handleAddMilestone = async () => {
    if (!milestoneName || !milestoneDescription || !milestoneDayCount || !milestonePercentage) {
      alert("Please fill in all milestone details.");
      return;
    }
    try {
      const fromAccount = selectedAccount || localStorage.getItem('selectedAccount') || employer;
      const projId = typeof projectId === 'bigint' ? projectId.toString() : String(projectId);
      const daycount = parseInt(String(milestoneDayCount), 10);
      const percentage = parseInt(String(milestonePercentage), 10);

      if (!Number.isFinite(daycount) || daycount <= 0) {
        alert("Days to complete must be a positive number.");
        return;
      }
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
        alert("Percentage must be between 1 and 100.");
        return;
      }
      if (!fromAccount) {
        alert("No wallet account selected. Please reconnect your wallet.");
        return;
      }

      await addMilestone(projId, milestoneName, milestoneDescription, daycount, percentage, fromAccount);
      setStatusMessage("Milestone added successfully!");
      setMilestoneName('');
      setMilestoneDescription('');
      setMilestoneDayCount('');
      setMilestonePercentage('');
      setShowMilestoneModal(false); // Close modal after successful addition
    } catch (error) {
      setStatusMessage("Failed to add milestone. Please try again.");
    }
  };

  const handleViewMilestones = async () => {
    try {
      if (!showMilestones) {
        const fetchedMilestones = await getMilestones(projectId);
        if (Array.isArray(fetchedMilestones)) {
          setMilestones(fetchedMilestones);
        } else {
          console.error("Fetched milestones data is not an array:", fetchedMilestones);
          setMilestones([]);
        }
      }
      setShowMilestones(!showMilestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  const handleViewRequests = async () => {
    // Legacy requests system - deprecated in favor of quotations
    // Just toggle the view without fetching
    setShowRequests(!showRequests);
  };

  const handleViewQuotations = async () => {
    try {
      if (!showQuotations) {
        setLoadingQuotations(true);
        const projId = typeof projectId === 'bigint' ? Number(projectId) : projectId;
        const fetchedQuotations = await getQuotations(projId);
        setQuotations(fetchedQuotations);
      }
      setShowQuotations(!showQuotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setStatusMessage("Failed to fetch quotations.");
    } finally {
      setLoadingQuotations(false);
    }
  };

  const handleAcceptQuotation = async (quotationIndex, amount) => {
    if (!window.confirm(`Accept this quotation for ${convertToEth(amount)} ETH?`)) {
      return;
    }

    try {
      setProcessingQuotation(quotationIndex);
      setStatusMessage('');
      const projId = typeof projectId === 'bigint' ? Number(projectId) : projectId;
      await acceptQuotation(projId, quotationIndex, amount, employer);
      setStatusMessage('✓ Quotation accepted! Escrow created. Project is now processed.');
      
      // Refresh quotations
      const fetchedQuotations = await getQuotations(projId);
      setQuotations(fetchedQuotations);
      
      // Call parent callback to refresh projects list
      if (onQuotationAccepted) {
        setTimeout(() => onQuotationAccepted(), 1500);
      }
    } catch (error) {
      console.error('Error accepting quotation:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setProcessingQuotation(null);
    }
  };

  const handleRejectQuotation = async (quotationIndex) => {
    if (!window.confirm('Reject this quotation?')) {
      return;
    }

    try {
      setProcessingQuotation(quotationIndex);
      setStatusMessage('');
      const projId = typeof projectId === 'bigint' ? Number(projectId) : projectId;
      await rejectQuotation(projId, quotationIndex, employer);
      setStatusMessage('Quotation rejected.');
      
      // Refresh quotations
      const fetchedQuotations = await getQuotations(projId);
      setQuotations(fetchedQuotations);
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setProcessingQuotation(null);
    }
  };

  const statusNames = ['Pending', 'Proposed', 'Negotiating', 'Accepted', 'Rejected'];

  // Determine if status message is error or success
  const isErrorMessage = statusMessage && statusMessage.toLowerCase().startsWith('error');
  const messageClassName = isErrorMessage ? 'status-message error' : 'status-message success';

  return (
    <div className={`project-card status-${getStatusClass()}`}>
      <div className="project-card-header">
        <div className="project-title-section">
          <h3>{title}</h3>
          <span className={`status-badge status-${getStatusClass()}`}>{getStatusLabel()}</span>
        </div>
      </div>
      
      <div className="project-details">
        <p><strong>Description:</strong> {description}</p>
        <p><strong>Reward:</strong> {reward} ETH</p>
        <p><strong>Employer:</strong> {employer}</p>
      </div>

      {getStatusClass() === 'open' ? (
        <div className="project-actions-open">
          <button className="btn btn-primary" onClick={() => setShowMilestoneModal(true)}>
            + Add Milestone
          </button>
        </div>
      ) : (
        <div className="project-processed-banner">
          ✓ This project has been assigned to a freelancer. View quotation details below.
        </div>
      )}

      {showMilestoneModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Add Milestone</h4>
            <input
              type="text"
              placeholder="Milestone Name"
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
            />
            <textarea
              placeholder="Milestone Description"
              value={milestoneDescription}
              onChange={(e) => setMilestoneDescription(e.target.value)}
            />
            <input
              type="number"
              placeholder="Days to Complete"
              value={milestoneDayCount}
              onChange={(e) => setMilestoneDayCount(e.target.value)}
            />
            <input
              type="number"
              placeholder="Percentage"
              value={milestonePercentage}
              onChange={(e) => setMilestonePercentage(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleAddMilestone}>Done</button>
              <button onClick={() => setShowMilestoneModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleViewMilestones}>
        {showMilestones ? "Hide Milestones" : "View Milestones"}
      </button>

      {showMilestones && (
        <div>
          <h4>Milestones</h4>
          {milestones.length > 0 ? (
            milestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                selectedAddress={employer} // Pass employer as selectedAddress
                projectId={projectId} // Pass projectId
              />
            ))
          ) : (
            <p>No milestones available.</p>
          )}
        </div>
      )}

      <button 
        onClick={handleViewRequests}
        disabled={true}
        title="Legacy feature - Use the Quotations system instead"
        style={{opacity: 0.5, cursor: 'not-allowed'}}
      >
        📋 Requests (Legacy - Use Quotations Instead)
      </button>

      {showRequests && (
        <div className="legacy-feature-warning">
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            padding: '15px',
            marginTop: '10px',
            color: '#856404'
          }}>
            <strong>⚠️ Notice:</strong> The old request system is no longer active. 
            <br/>
            Freelancers now send <strong>Quotations</strong> for projects. 
            <br/>
            Please view the <strong>"View Quotations"</strong> button above to manage freelancer proposals.
          </div>
        </div>
      )}

      <button onClick={handleViewQuotations} disabled={loadingQuotations || getStatusClass() === 'processed'}>
        {getStatusClass() === 'processed' ? '✓ Project Already Assigned' : (showQuotations ? "Hide Quotations" : "View Quotations")}
      </button>

      {getStatusClass() === 'processed' ? (
        <div className="project-completed-section">
          <div className="completed-banner">
            <h4>✓ Project Successfully Assigned</h4>
            <p>This project has been assigned to a freelancer and is no longer accepting new quotations.</p>
            {quotations.length > 0 && quotations.some(q => q.status === 3) && (
              <div className="accepted-quotation-info">
                {quotations.map((q, idx) => 
                  q.status === 3 ? (
                    <div key={idx} className="assigned-freelancer">
                      <strong>Assigned Freelancer:</strong> {q.proposedBy}
                      <br />
                      <strong>Amount:</strong> {convertToEth(q.proposedAmount)} ETH
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        showQuotations && (
          <div className="quotations-section">
            <h4>Quotations from Freelancers</h4>
            {loadingQuotations ? (
              <p>Loading quotations...</p>
            ) : quotations.length > 0 ? (
              <div className="quotations-list">
                {quotations.map((quotation, index) => {
                  const status = Number(quotation.status); // Convert BigInt to number
                  const statusName = statusNames[status] || 'Unknown';
                  const canAccept = status === 0 || status === 1 || status === 2; // Pending, Proposed, or Negotiating
                  const canReject = status === 0 || status === 1 || status === 2;
                  
                  console.log('Quotation', index, '- Status:', status, 'StatusName:', statusName, 'canAccept:', canAccept, 'canReject:', canReject);
                  
                  return (
                    <div key={index} className={`quotation-item status-${statusName.toLowerCase()}`}>
                      <div className="quotation-info">
                        <div className="quotation-freelancer">
                          <strong>👤 Freelancer:</strong> {quotation.proposedBy}
                        </div>
                        <div className="quotation-amount">
                          <strong>💰 Amount:</strong> {convertToEth(quotation.proposedAmount)} ETH
                        </div>
                        <div className="quotation-description">
                          <strong>📝 Description:</strong> {quotation.description || 'No description'}
                        </div>
                        <div className="quotation-status">
                          <strong>Status:</strong> <span className={`status-badge status-${statusName.toLowerCase()}`}>{statusName}</span>
                        </div>
                        <div className="quotation-timestamp">
                          <small>Submitted: {new Date(parseInt(quotation.timestamp) * 1000).toLocaleString()}</small>
                        </div>
                      </div>
                      <div className="quotation-actions">
                        {canAccept && (
                          <button 
                            className="btn btn-accept"
                            onClick={() => handleAcceptQuotation(index, quotation.proposedAmount)}
                            disabled={processingQuotation === index}
                          >
                            {processingQuotation === index ? '⏳ Processing...' : '✓ Accept'}
                          </button>
                        )}
                        {canReject && (
                          <button 
                            className="btn btn-reject"
                            onClick={() => handleRejectQuotation(index)}
                            disabled={processingQuotation === index}
                          >
                            {processingQuotation === index ? '⏳ Processing...' : '✗ Reject'}
                          </button>
                        )}
                        {status === 3 && (
                          <div className="quotation-accepted">✓ Accepted</div>
                        )}
                        {status === 4 && (
                          <div className="quotation-rejected">✗ Rejected</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No quotations received for this project yet.</p>
            )}
          </div>
        )
      )}

      {statusMessage && <p className={messageClassName}>{statusMessage}</p>}
    </div>
  );
}

export default ProjectCard;
