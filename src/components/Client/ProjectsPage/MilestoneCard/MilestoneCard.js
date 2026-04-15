import React, { useState } from 'react';
import { downloadFilesForMilestone, fetchMilestoneReviewRequestsByMilestoneId } from '../../../../services/web3'; // Adjust the path based on your project structure
import ReviewRequestCard from './ReviewRequestCard/ReviewRequestCard'; // Adjust the path based on your project structure
import './MilestoneCard.css'

function MilestoneCard({ milestone, selectedAddress, projectId }) {
  console.log(selectedAddress);
  const [reviewRequests, setReviewRequests] = useState([]);
  const [showReviewRequests, setShowReviewRequests] = useState(false); // State to track visibility

  // Handler to download files for the milestone
  const handleDownloadFiles = async () => {
    await downloadFilesForMilestone(milestone.id);
  };

  // Handler to fetch review requests for the milestone
  const handleViewReviewRequests = async () => {
    if (showReviewRequests) {
      // If already showing, just hide the requests
      setShowReviewRequests(false);
      setReviewRequests([]); // Clear the requests when hiding
    } else {
      // If not showing, fetch and show the requests
      try {
        const requests = await fetchMilestoneReviewRequestsByMilestoneId(milestone.id);
        setReviewRequests(requests);
        setShowReviewRequests(true); // Set to true to show requests
      } catch (error) {
        console.error('Error fetching review requests:', error);
      }
    }
  };

  return (
    <div className="milestone-card">
      <p>Milestone ID: {milestone.id}</p>
      <p>Name: {milestone.name}</p>
      <p>Description: {milestone.description}</p>
      <p>Days to Complete: {milestone.daycount}</p>
      <p>Percentage: {milestone.percentage}%</p>
      <p>Completed: {milestone.completed ? "Yes" : "No"}</p>
      
      {/* Download Files Button */}
      <button onClick={handleDownloadFiles}>Download Files</button>
      
      {/* View Review Requests Button */}
      <button onClick={handleViewReviewRequests}>
        {showReviewRequests ? "Hide Review Requests" : "View Review Requests"}
      </button>

      {/* Display Review Requests */}
      {showReviewRequests && reviewRequests.length > 0 && (
        <div className="review-requests">
          {reviewRequests.map(request => (
            <ReviewRequestCard key={request.requestId} request={request} selectedAccount={selectedAddress} projectId={projectId}/>
          ))}
        </div>
      )}
    </div>
  );
}

export default MilestoneCard;

