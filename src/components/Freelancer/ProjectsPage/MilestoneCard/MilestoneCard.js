// MilestoneCard.js
import React from 'react';
import './MilestoneCard.css'

function MilestoneCard({ milestone }) {
  return (
    <div className="milestone-card">
      <p>Milestone ID: {milestone.id}</p>
      <p>Name: {milestone.name}</p>
      <p>Description: {milestone.description}</p>
      <p>Days to Complete: {milestone.daycount}</p>
      <p>Percentage: {milestone.percentage}%</p>
      <p>Completed: {milestone.completed ? "Yes" : "No"}</p>
    </div>
  );
}

export default MilestoneCard;
