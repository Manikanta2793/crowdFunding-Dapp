

import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AllCampaigns from "./components/AllCampaigns";
import CreateCampaign from "./components/CreateCampaign";
import MyCampaigns from "./components/MyCampaigns";
import MyInvestments from "./components/MyInvestments";
import WalletConnect from "./components/WalletConnect";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "./utils/contractABI";
import "./App.css";

function HomeLanding({ walletInfo }) {
  const campaignsRef = useRef(null);
  const handleScrollToCampaigns = () => {
    if (campaignsRef.current) {
      campaignsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  // Debug: confirm HomeLanding is rendering
  useEffect(() => {
    console.log("HomeLanding rendered");
  }, []);
  return (
    <div>
      <section style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        borderRadius: "12px",
        marginBottom: "2rem"
      }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Welcome to CrowdFunding DApp</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: 600, textAlign: "center", marginBottom: "2rem" }}>
          Discover, support, and launch innovative projects on the blockchain. Connect your wallet, browse campaigns, and make a difference with your investment. Scroll down to explore all active campaigns!
        </p>
        <button onClick={handleScrollToCampaigns} style={{ padding: "12px 32px", fontSize: "1.1rem", background: "#3498db", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>View All Campaigns</button>
      </section>
      <div ref={campaignsRef}>
        <AllCampaigns walletInfo={walletInfo} />
      </div>
    </div>
  );
}

function App() {
  const [walletInfo, setWalletInfo] = useState(null);
  const infoSectionRef = useRef(null);

  // Persist wallet address in localStorage
  useEffect(() => {
    if (walletInfo?.address) {
      localStorage.setItem("walletAddress", walletInfo.address);
    } else {
      localStorage.removeItem("walletAddress");
    }
  }, [walletInfo]);

  // Removed auto-connect wallet logic to prevent MetaMask connection errors on page load.

  // Handler to scroll to info section
  const handleHomeClick = () => {
    if (infoSectionRef.current) {
      infoSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Router>
      <div className="app">
        <Sidebar onHomeClick={handleHomeClick} />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "1rem" }}>
            <WalletConnect walletInfo={walletInfo} setWalletInfo={setWalletInfo} />
          </div>
          <div ref={infoSectionRef}>
            <Routes>
              <Route path="/" element={<HomeLanding walletInfo={walletInfo} />} />
              <Route path="/all-campaigns" element={<AllCampaigns walletInfo={walletInfo} />} />
              <Route path="/create-campaign" element={<CreateCampaign />} />
              <Route path="/my-campaigns" element={<MyCampaigns walletInfo={walletInfo} />} />
              <Route path="/my-investments" element={<MyInvestments walletInfo={walletInfo} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
