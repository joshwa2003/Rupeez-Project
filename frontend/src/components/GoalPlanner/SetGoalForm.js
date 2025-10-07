import React, { useState } from 'react';

const SetGoalForm = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !targetAmount || !deadline) {
      alert('Please fill all fields');
      return;
    }
    onSubmit({ title, targetAmount: parseFloat(targetAmount), deadline });
  };

  return (
    <form onSubmit={handleSubmit} className="set-goal-form">
      <div className="form-group">
        <label htmlFor="title">Goal Name</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter goal name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="targetAmount">Target Amount (₹)</label>
        <input
          type="number"
          id="targetAmount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="Enter target amount"
          min="1"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="deadline">Deadline</label>
        <input
          type="date"
          id="deadline"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <button type="submit" className="btn btn-primary">Set Goal</button>
    </form>
  );
};

export default SetGoalForm;
