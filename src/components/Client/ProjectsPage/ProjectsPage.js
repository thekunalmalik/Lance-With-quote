import React, { useEffect, useState, useCallback } from 'react';
import { fetchUserProjects } from '../../../services/web3';
import ProjectCard from './ProjectCard/ProjectCard';
import { useLocation } from 'react-router-dom';
import './ProjectsPage.css';

function ClientProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  // Get selectedAccount from location state or localStorage
  const getSelectedAccount = useCallback(() => {
    // Try location state first (if navigating from Client component)
    if (location.state && location.state.selectedAccount) {
      return location.state.selectedAccount;
    }
    // Fall back to localStorage
    const stored = localStorage.getItem('selectedAccount');
    return stored ? JSON.parse(stored) : null;
  }, [location.state]);

  const selectedAccount = getSelectedAccount();

  const loadProjects = useCallback(async () => {
    if (selectedAccount) {
      try {
        setLoading(true);
        setError(null);
        const userProjects = await fetchUserProjects(selectedAccount);
        setProjects(userProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    } else {
      setError('No selected account found. Please reconnect your wallet.');
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleQuotationAccepted = () => {
    // Refresh projects after quotation is accepted
    loadProjects();
  };

  return (
    <div className="client-projects-page">
      <div className="projects-header">
        <h2>Your Projects</h2>
        <button className="refresh-btn" onClick={loadProjects} disabled={loading}>
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="loading">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              projectId={project.id}
              title={project.title}
              description={project.description}
              reward={project.reward}
              status={project.status}
              employer={project.employer}
              selectedAccount={selectedAccount}
              onQuotationAccepted={handleQuotationAccepted}
            />
          ))}
        </div>
      ) : (
        <p className="no-projects">No projects found.</p>
      )}
    </div>
  );
}

export default ClientProjectsPage;
