import React from 'react';

const ProgressBar = ({ progress }) => {
  const progressPercent = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-bar-container" style={{ backgroundColor: 'var(--progress-bg)', borderRadius: '8px', overflow: 'hidden', height: '20px', width: '100%', position: 'relative' }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${progressPercent}%`,
          backgroundColor: 'var(--progress-fill)',
          height: '100%',
          transition: 'width 0.5s ease-in-out',
        }}
      />
      <span className="progress-bar-text" style={{ position: 'absolute', width: '100%', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 'bold' }}>
        {progressPercent.toFixed(0)}% completed
      </span>
    </div>
  );
};

export default ProgressBar;
