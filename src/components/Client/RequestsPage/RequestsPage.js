// // src/components/Client/RequestsPage.js
// import React, { useEffect, useState } from 'react';
// import { fetchRequestsByEmployer } from '../../../services/web3'; // Import the function to get requests
// import RequestCard from './RequestCard/RequestCard';
// import { useLocation } from 'react-router-dom';

// function RequestsPage() {
//   const [requests, setRequests] = useState([]); // State to store fetched requests
//   const location = useLocation();
//   const { selectedAccount } = location.state || {}; // Retrieve selected account if passed
//   console.log(selectedAccount);

//   useEffect(() => {
//     const loadRequests = async () => {
//       if (selectedAccount) {
//         try {
//           const employerRequests = await fetchRequestsByEmployer(selectedAccount); // Pass selectedAccount
//           setRequests(employerRequests);
//         } catch (error) {
//           console.error("Error fetching employer's requests:", error);
//         }
//       }
//     };

//     loadRequests(); // Trigger request loading when component mounts
//   }, [selectedAccount]);

//   return (
//     <div>
//       <h2>Your Requests</h2>
//       {requests.length > 0 ? (
//         requests.map((request, index) => (
//           <RequestCard
//             key={index}
//             requestId={request.requestId} // Pass request details to RequestCard
//             projectId={request.projectId}
//             freelancer={request.freelancer}
//             freelancerRating={request.freelancerRating}
//             status={request.status}
//             escrowContract={request.escrowContract}
//           />
//         ))
//       ) : (
//         <p>No requests found.</p>
//       )}
//     </div>
//   );
// }

// export default RequestsPage;
