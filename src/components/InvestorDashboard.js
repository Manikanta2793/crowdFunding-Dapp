import React from "react";
import "./InvestorDashboard.css";

const InvestorDashboard = () => {
  return (
    <div className="investor-dashboard">
      <h1>Investor Dashboard</h1>
      <p>Track your investments, view your supported campaigns, and manage refunds or claims.</p>
      <ul>
        <li>View your investments</li>
        <li>Check campaign progress</li>
        <li>Request refunds or receive rewards</li>
      </ul>
    </div>
  );
};

export default InvestorDashboard;
