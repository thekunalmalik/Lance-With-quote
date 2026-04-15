// // FreelancerProjectsPage.js
// import React, { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom'; // Import useLocation to access passed state
// import { fetchAllProjects } from '../../../services/web3';
// import FreelancerProjectCard from './ProjectCard/ProjectCard';

// const FreelancerProjectsPage = () => {
//   const location = useLocation(); // Get the location object
//   const { selectedAccount } = location.state || {}; // Extract selectedAccount from state
//   const [projects, setProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadProjects = async () => {
//       try {
//         const fetchedProjects = await fetchAllProjects();
//         setProjects(fetchedProjects);
//       } catch (error) {
//         console.error("Error loading projects:", error);
//         setError("Failed to load projects. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadProjects();
//   }, []);

//   return (
//     <div>
//       <h2>Available Projects</h2>
//       {selectedAccount && <p>Selected Account: {selectedAccount}</p>} {/* Display the selected account */}
//       {loading ? (
//         <p>Loading projects...</p>
//       ) : error ? (
//         <p>{error}</p>
//       ) : projects.length > 0 ? (
//         projects.map((project) => (
//           <FreelancerProjectCard 
//             key={project.id} 
//             project={project} 
//             selectedAccount={selectedAccount} // Pass selectedAccount here
//           />
//         ))
//       ) : (
//         <p>No projects available at the moment.</p>
//       )}
//     </div>
//   );
// };

// export default FreelancerProjectsPage;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation to access passed state
import { fetchAllProjects } from '../../../services/web3';
import FreelancerProjectCard from './ProjectCard/ProjectCard';
import './ProjectsPage.css'; // Import the CSS file

const FreelancerProjectsPage = () => {
  const location = useLocation(); // Get the location object
  const { selectedAccount } = location.state || {}; // Extract selectedAccount from state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const fetchedProjects = await fetchAllProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await fetchAllProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error refreshing projects:", error);
      setError("Failed to refresh projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="freelancer-projects-page">
      <div className="projects-header">
        <h2>Available Projects</h2>
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {selectedAccount && <p className="selected-account">Connected Account: {selectedAccount}</p>}
      {loading ? (
        <p className="loading">Loading projects...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : projects.length > 0 ? (
        <div className="freelancer-projects-grid"> {/* Grid container for project cards */}
          {projects.map((project) => (
            <FreelancerProjectCard 
              key={project.id} 
              project={project} 
              selectedAccount={selectedAccount} // Pass selectedAccount here
            />
          ))}
        </div>
      ) : (
        <p>No projects available at the moment.</p>
      )}
    </div>
  );
};

export default FreelancerProjectsPage;
