// // import React from 'react';
// // import { acceptRequest, rejectRequest } from '../../../../services/web3';
// // import './RequestCard.css'

// // function RequestCard({ request, employer, projectReward }) {
// //   const handleAccept = async () => {
// //     try {
// //       await acceptRequest(request.requestId, employer, projectReward);
// //       alert('Request accepted successfully');
// //     } catch (error) {
// //       alert('Error accepting request');
// //       console.error(error);
// //     }
// //   };

// //   const handleReject = async () => {
// //     try {
// //       await rejectRequest(request.requestId, employer);
// //       alert('Request rejected successfully');
// //     } catch (error) {
// //       alert('Error rejecting request');
// //       console.error(error);
// //     }
// //   };

// //   return (
// //     <div className="request-card">
// //       <p>Request ID: {request.requestId}</p>
// //       <p>Project ID: {request.projectId}</p>
// //       <p>Freelancer: {request.freelancer}</p>
// //       <p>Freelancer Rating: {request.freelancerRating}</p>
// //       <p>Status: {request.status}</p>
// //       <p>Escrow Contract: {request.escrowContract}</p>
      
// //       {/* Accept and Decline buttons */}
// //       <button onClick={handleAccept}>Accept</button>
// //       <button onClick={handleReject}>Decline</button>
// //     </div>
// //   );
// // }

// // export default RequestCard;

// import React from 'react';
// import { acceptRequest, rejectRequest } from '../../../../services/web3';
// import './RequestCard.css';

// function RequestCard({ request, employer, projectReward }) {
//   const handleAccept = async () => {
//     try {
//       await acceptRequest(request.requestId, employer, projectReward);
//       alert('Request accepted successfully');
//     } catch (error) {
//       alert('Error accepting request');
//       console.error(error);
//     }
//   };

//   const handleReject = async () => {
//     try {
//       await rejectRequest(request.requestId, employer);
//       alert('Request rejected successfully');
//     } catch (error) {
//       alert('Error rejecting request');
//       console.error(error);
//     }
//   };

//   return (
//     <div className="request-card">
//       <p>Request ID: {request.requestId}</p>
//       <p>Project ID: {request.projectId}</p>
//       <p>Freelancer: {request.freelancer}</p>
//       <p>Freelancer Rating: {request.freelancerRating}</p>
//       <p>Status: {request.status}</p>
//       <p>Escrow Contract: {request.escrowContract}</p>
      
//       {/* Conditionally render buttons based on the request status */}
//       {request.status !== 'Approved' && (
//         <div>
//           <button onClick={handleAccept}>Accept</button>
//           <button onClick={handleReject}>Decline</button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default RequestCard;


import React from 'react';
import { acceptRequest, rejectRequest } from '../../../../services/web3';
import './RequestCard.css';

function RequestCard({ request, employer, projectReward }) {
  const handleAccept = async () => {
    if (!window.confirm('Accept this request?')) return;
    try {
      console.log('Request ID:', request.requestId);
      console.log('Project ID:', request.projectId);
      console.log('Employer:', employer);
      console.log('Project Reward:', projectReward);
      await acceptRequest(request.requestId, employer, projectReward, request.projectId);
      alert('Request accepted successfully! Reloading page...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      alert(`Error accepting request: ${error.message}`);
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject this request?')) return;
    try {
      await rejectRequest(request.requestId, employer);
      alert('Request rejected successfully! Reloading page...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      alert(`Error rejecting request: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="request-card">
      <p>Request ID: {request.requestId}</p>
      <p>Project ID: {request.projectId}</p>
      <p>Freelancer: {request.freelancer}</p>
      <p>Freelancer Rating: {request.freelancerRating}</p>
      <p>Status: {request.status}</p>
      <p>Escrow Contract: {request.escrowContract}</p>
      
      {/* Conditionally render buttons based on the request status */}
      {request.status === 'Pending' && (
        <div>
          <button onClick={handleAccept}>Accept</button>
          <button onClick={handleReject}>Decline</button>
        </div>
      )}
    </div>
  );
}

export default RequestCard;
