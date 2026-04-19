import React, { useState } from 'react';
import { uploadFiletoIPFS } from '../../../../services/ipfs'; // Adjust the path based on your project structure
import { fetchReviewResponsesByMilestoneId, raiseDispute, uploadMilestoneProof } from '../../../../services/web3';
import ReviewResponseCard from './ReviewResponseCard/ReviewResponseCard';
import './MilestoneCard.css';

function MilestoneCard({ milestone, selectedAccount }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [reviewResponses, setReviewResponses] = useState([]);
    const [showResponses, setShowResponses] = useState(false); // Toggle state for responses

    const getStatusString = (status) => {
        const statuses = ['Pending', 'Submitted', 'Approved', 'Disputed', 'Resolved'];
        return statuses[status] || 'Unknown';
    };

    // Handle file selection
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file to upload.");
            return;
        }
        try {
            const result = await uploadFiletoIPFS(selectedFile, milestone.id, selectedAccount);
            setUploadResult(result);
            console.log('Uploaded IPFS URL:', result.url);
            
            // Now submit the milestone proof
            const submitResult = await uploadMilestoneProof(milestone.projectId, milestone.id, selectedAccount, result.url);
            if (submitResult.success) {
                alert("File uploaded and milestone submitted successfully!");
            } else {
                alert("File uploaded but failed to submit milestone: " + submitResult.message);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file.");
        }
    };

    // Handle raising dispute
    const handleRaiseDispute = async () => {
        try {
            const result = await raiseDispute(milestone.id, milestone.projectId, selectedAccount);
            if (result.success) {
                alert("Dispute raised successfully!");
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error raising dispute:", error);
            alert("Failed to raise dispute.");
        }
    };

    // Handle toggling review responses
    const handleToggleReviewResponses = async () => {
        if (!showResponses) {
            try {
                const responses = await fetchReviewResponsesByMilestoneId(milestone.id);
                setReviewResponses(responses);
            } catch (error) {
                console.error("Error fetching review responses:", error);
            }
        }
        setShowResponses(!showResponses);
    };

    return (
        <div className="milestone-card">
            <p>Milestone ID: {milestone.id}</p>
            <p>Name: {milestone.name}</p>
            <p>Description: {milestone.description}</p>
            <p>Days to Complete: {milestone.daycount}</p>
            <p>Percentage: {milestone.percentage}%</p>
            <p>Status: {getStatusString(milestone.status)}</p>
            <p>Freelancer: {milestone.freelancer}</p>
            <p>Client: {milestone.client}</p>
            <p>Amount: {milestone.amount}</p>

            {/* File Upload Section */}
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload File</button>

            {/* Display the upload result if needed */}
            {uploadResult && (
                <p>
                    File uploaded to IPFS: <a href={uploadResult.url} target="_blank" rel="noreferrer">{uploadResult.url}</a>
                </p>
            )}

            {/* Button to View Review Responses */}
            <button onClick={handleToggleReviewResponses}>
                {showResponses ? "Hide Review Responses" : "View Review Responses"}
            </button>

            {/* Raise Dispute Button */}
            {milestone.status === 1 && (selectedAccount === milestone.freelancer || selectedAccount === milestone.client) && (
                <button onClick={handleRaiseDispute}>Raise Dispute</button>
            )}

            {/* Display Review Responses if showResponses is true */}
            {showResponses && reviewResponses.length > 0 && (
                <div className="review-responses">
                    <h3>Review Responses:</h3>
                    {reviewResponses.map(response => (
                        <ReviewResponseCard key={response.responseId} response={response} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MilestoneCard;
