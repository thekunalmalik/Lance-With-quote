import React, { useState } from 'react';
import { uploadFiletoIPFS } from '../../../../services/ipfs'; // Adjust the path based on your project structure
import { fetchReviewResponsesByMilestoneId } from '../../../../services/web3';
import ReviewResponseCard from './ReviewResponseCard/ReviewResponseCard';
import './MilestoneCard.css';

function MilestoneCard({ milestone, selectedAccount }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [reviewResponses, setReviewResponses] = useState([]);
    const [showResponses, setShowResponses] = useState(false); // Toggle state for responses

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
            alert("File uploaded successfully!");
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file.");
        }
    };

    // Handle fetching review responses
    const handleToggleReviewResponses = async () => {
        // Toggle the display of responses
        setShowResponses(prevShowResponses => !prevShowResponses);

        // Fetch review responses only if toggling to "show"
        if (!showResponses && reviewResponses.length === 0) {
            try {
                const responses = await fetchReviewResponsesByMilestoneId(milestone.id);
                setReviewResponses(responses);
            } catch (error) {
                console.error("Error fetching review responses:", error);
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
            <p>Proof File Hash: {milestone.proofFileHash}</p>

            {/* File Upload Section */}
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload File</button>

            {/* Display the upload result if needed */}
            {uploadResult && (
                <p>File uploaded to IPFS with hash: {uploadResult.hash}</p>
            )}

            {/* Button to View Review Responses */}
            <button onClick={handleToggleReviewResponses}>
                {showResponses ? "Hide Review Responses" : "View Review Responses"}
            </button>

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
