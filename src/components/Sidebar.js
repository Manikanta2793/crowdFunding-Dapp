import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ onHomeClick }) => {
  return (
    <div className="sidebar">
      <h2 style={{ cursor: "pointer" }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none", wordBreak: "break-word" }}>CrowdFunding</Link>
      </h2>
      <nav>
        <ul>
          <li><Link to="/all-campaigns">All Campaigns</Link></li>
          <li><Link to="/create-campaign">Create Campaign</Link></li>
          <li><Link to="/my-campaigns">My Campaigns</Link></li>
          <li><Link to="/my-investments">My Investments</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
