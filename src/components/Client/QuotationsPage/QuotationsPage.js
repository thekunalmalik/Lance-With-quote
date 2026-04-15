import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  getEmployerProjectsWithQuotations, 
  acceptQuotation,
  rejectQuotation
} from '../../../services/web3';
import './QuotationsPage.css';
import QuotationCard from './QuotationCard/QuotationCard';

const QuotationsPage = () => {
  const location = useLocation();
  const { selectedAccount } = location.state || {};
  
  const [projectsWithQuotations, setProjectsWithQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  useEffect(() => {
    const loadQuotations = async () => {
      if (!selectedAccount) {
        setError('No account selected. Please connect your wallet.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching quotations for employer:', selectedAccount);
        const projects = await getEmployerProjectsWithQuotations(selectedAccount);
        
        console.log('Projects with quotations:', projects);
        setProjectsWithQuotations(projects);
        
        if (projects.length === 0) {
          setError('No incoming quotations yet.');
        }
      } catch (err) {
        console.error('Error loading quotations:', err);
        setError(`Failed to load quotations: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [selectedAccount]);

  const handleRefresh = async () => {
    if (!selectedAccount) return;
    
    try {
      setLoading(true);
      setError(null);
      const projects = await getEmployerProjectsWithQuotations(selectedAccount);
      setProjectsWithQuotations(projects);
    } catch (err) {
      console.error('Error refreshing quotations:', err);
      setError(`Failed to refresh: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuotation = async (projectId, quotationIndex, amount) => {
    try {
      await acceptQuotation(projectId, quotationIndex, amount, selectedAccount);
      setError(null);
      // Refresh the list
      await handleRefresh();
    } catch (err) {
      setError(`Error accepting quotation: ${err.message}`);
    }
  };

  const handleRejectQuotation = async (projectId, quotationIndex) => {
    try {
      await rejectQuotation(projectId, quotationIndex, selectedAccount);
      setError(null);
      // Refresh the list
      await handleRefresh();
    } catch (err) {
      setError(`Error rejecting quotation: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="quotations-page">
        <h2>Incoming Quotations</h2>
        <p className="loading">Loading quotations...</p>
      </div>
    );
  }

  return (
    <div className="quotations-page">
      <div className="quotations-header">
        <h2>Incoming Quotations from Freelancers</h2>
        <button className="refresh-btn" onClick={handleRefresh}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {projectsWithQuotations.length === 0 ? (
        <div className="empty-state">
          <p>No incoming quotations yet.</p>
          <p>When freelancers apply to your projects, their quotations will appear here.</p>
        </div>
      ) : (
        <div className="quotations-list">
          {projectsWithQuotations.map((project) => (
            <div key={project.id} className="project-quotations">
              <div 
                className="project-header-collapsible"
                onClick={() => setExpandedProjectId(
                  expandedProjectId === project.id ? null : project.id
                )}
              >
                <div className="project-info">
                  <h3>{project.title}</h3>
                  <span className="quotation-badge">
                    {project.quotationCount} quotation{project.quotationCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="project-details">
                  <span className="reward">Reward: {project.reward} wei</span>
                  <span className="toggle-icon">
                    {expandedProjectId === project.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedProjectId === project.id && (
                <div className="quotations-container">
                  <p className="project-description">{project.description}</p>
                  <div className="quotations-grid">
                    {project.allQuotations.map((quotation, index) => (
                      <QuotationCard
                        key={index}
                        quotation={quotation}
                        quotationIndex={index}
                        projectId={project.id}
                        projectReward={project.reward}
                        onAccept={handleAcceptQuotation}
                        onReject={handleRejectQuotation}
                        selectedAccount={selectedAccount}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
