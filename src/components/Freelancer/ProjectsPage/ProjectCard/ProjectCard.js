// FreelancerProjectCard.js
import React, { useEffect, useState } from 'react';
import { getFreelancerRating, getMilestones } from '../../../../services/web3'; // Adjust the path based on your project structure
import QuotationForm from '../../QuotationForm/QuotationForm'; // Import QuotationForm
import MilestoneCard from '../MilestoneCard/MilestoneCard';
import './ProjectCard.css'

const FreelancerProjectCard = ({ project, selectedAccount }) => { // Accept selectedAccount as a prop
  const { id, title, description, reward, status, employer } = project;
  const [freelancerRating, setFreelancerRating] = useState(0);
  const [milestones, setMilestones] = useState([]);
  const [showMilestones, setShowMilestones] = useState(false); // New state for toggling milestones view
  const [showQuotationForm, setShowQuotationForm] = useState(false); // Show/hide quotation form modal

  console.log('ProjectCard loaded with - Project ID:', id, 'Type:', typeof id, 'Account:', selectedAccount);

  // Fetch the freelancer's rating when the component mounts
  useEffect(() => {
    const fetchFreelancerRating = async () => {
      if (selectedAccount) {
        try {
          const rating = await getFreelancerRating(selectedAccount);
          setFreelancerRating(rating.rating);
        } catch (error) {
          console.error('Error fetching freelancer rating:', error);
        }
      }
    };

    fetchFreelancerRating();
  }, [selectedAccount]);

  // Handle opening the quotation form
  const handleSendRequest = () => {
    setShowQuotationForm(true);
  };

  // Handle quotation form success
  const handleQuotationSuccess = () => {
    setShowQuotationForm(false);
    // Optionally refresh the page or show notification
  };

  // Handle viewing milestones for the project
  const handleViewMilestones = async () => {
    try {
      if (!showMilestones) {
        const fetchedMilestones = await getMilestones(id);

        // Ensure fetched milestones are in an array format
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

  return (
    <div className="freelancer-project-card">
      <h3>{title}</h3>
      <p>Description: {description}</p>
      <p>Reward: {reward} ETH</p>
      <p>Status: {status}</p>
      <p>Employer: {employer}</p>
      <p>Freelancer Rating: {freelancerRating !== undefined && freelancerRating !== null ? freelancerRating.toString() : 'N/A'} / 5</p>

      <button onClick={handleSendRequest}>
        Send Request
      </button>

      {/* Button to view milestones */}
      <button onClick={handleViewMilestones}>
        {showMilestones ? "Hide Milestones" : "View Milestones"}
      </button>

      {/* Display milestones if showMilestones is true */}
      {showMilestones && (
        <div>
          <h4>Milestones</h4>
          {milestones.length > 0 ? (
            milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))
          ) : (
            <p>No milestones available.</p>
          )}
        </div>
      )}

      {/* Quotation Form Modal */}
      {showQuotationForm && (
        <div className="modal-overlay" onClick={() => setShowQuotationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowQuotationForm(false)}
            >
              ✕
            </button>
            <QuotationForm 
              projectId={id}
              projectReward={reward}
              freelancerAddress={selectedAccount}
              freelancerRating={freelancerRating}
              onSuccess={handleQuotationSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerProjectCard;

