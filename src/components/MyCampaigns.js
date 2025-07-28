import React, { useEffect, useState } from "react";
import "../components/MyCampaigns.css";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/contractABI";

const MyCampaigns = ({ walletInfo }) => {
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [status, setStatus] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (walletInfo?.address) {
      setUserAddress(walletInfo.address);
    } else {
      setUserAddress("");
    }
  }, [walletInfo]);

  const loadMyCampaigns = async () => {
    try {
      if (!userAddress || !walletInfo?.contract) return;
      const campaigns = await walletInfo.contract.getMyCampaigns(userAddress);
      // [id, Title, Description, GoalAmount, MinimumAmount, deadline, Creator_address, fundsRaised, claimedStatus, category, isActive]
      const formattedCampaigns = campaigns.map((campaign, idx) => ({
        id: campaign[0]?.toString(),
        title: campaign[1],
        description: campaign[2],
        category: campaign[9] || "",
        goal: campaign[3] ? campaign[3].toString() : "0",
        amountCollected: campaign[7] ? campaign[7].toString() : "0",
        minContribution: campaign[4] ? campaign[4].toString() : "0",
        deadline: campaign[5] ? campaign[5].toString() : "0",
        claimedStatus: campaign[8],
        isActive: campaign[10],
      }));
      setMyCampaigns(formattedCampaigns);
    } catch (err) {
      console.error("Error loading campaigns:", err);
      setStatus("Could not fetch your campaigns.");
    }
  };



  useEffect(() => {
    if (walletInfo?.contract && userAddress) {
      loadMyCampaigns();
    }
  }, [walletInfo, userAddress]);

  // Pause campaign
  const handlePause = async (id) => {
    if (!walletInfo?.contract) return;
    setActionLoading((prev) => ({ ...prev, [id]: 'pausing' }));
    setStatus("");
    try {
      const tx = await walletInfo.contract.pause(id);
      await tx.wait();
      setStatus("Campaign paused.");
      await loadMyCampaigns();
    } catch (err) {
      setStatus("Pause failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Unpause campaign
  const handleUnpause = async (id) => {
    if (!walletInfo?.contract) return;
    setActionLoading((prev) => ({ ...prev, [id]: 'unpausing' }));
    setStatus("");
    try {
      const tx = await walletInfo.contract.unpause(id);
      await tx.wait();
      setStatus("Campaign resumed.");
      await loadMyCampaigns();
    } catch (err) {
      setStatus("Resume failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Claim funds
  const handleClaim = async (id) => {
    if (!walletInfo?.contract) return;
    setActionLoading((prev) => ({ ...prev, [id]: 'claiming' }));
    setStatus("");
    try {
      const tx = await walletInfo.contract.claimFunds(id);
      await tx.wait();
      setStatus("Funds claimed.");
      await loadMyCampaigns();
    } catch (err) {
      setStatus("Claim failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="my-campaigns">
      <h2>My Campaigns</h2>
      {/* {status && <p className="status">{status}</p>} */}
      <div className="my-campaigns-list">
        {myCampaigns.map((campaign) => (
          <div className="my-campaign-card" key={campaign.id}>
            <h3>{campaign.title}</h3>
            <p><strong>Category:</strong> {campaign.category}</p>
            <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal || "0")} ETH</p>
            <p><strong>Raised:</strong> {ethers.formatEther(campaign.amountCollected || "0")} ETH</p>
            <p><strong>Min Contribution:</strong> {ethers.formatEther(campaign.minContribution || "0")} ETH</p>
            <p><strong>Deadline:</strong> {campaign.deadline !== "0" ? new Date(Number(campaign.deadline) * 1000).toLocaleDateString() : "N/A"}</p>
            <p><strong>Description:</strong> {campaign.description}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {campaign.isActive ? (
                <button
                  onClick={() => handlePause(campaign.id)}
                  disabled={actionLoading[campaign.id]}
                  style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }}
                >
                  {actionLoading[campaign.id] === 'pausing' ? 'Pausing...' : 'Pause'}
                </button>
              ) : (
                <button
                  onClick={() => handleUnpause(campaign.id)}
                  disabled={actionLoading[campaign.id]}
                  style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }}
                >
                  {actionLoading[campaign.id] === 'unpausing' ? 'Resuming...' : 'Resume'}
                </button>
              )}
              <button
                onClick={() => handleClaim(campaign.id)}
                disabled={actionLoading[campaign.id] || campaign.claimedStatus}
                style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: campaign.claimedStatus ? 'not-allowed' : 'pointer', opacity: campaign.claimedStatus ? 0.6 : 1 }}
              >
                {campaign.claimedStatus ? 'Claimed' : (actionLoading[campaign.id] === 'claiming' ? 'Claiming...' : 'Claim')}
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 500, color: campaign.isActive ? '#27ae60' : '#e67e22' }}>
                Status: {campaign.isActive ? 'Active' : 'Paused'}
              </span>
              {campaign.claimedStatus && (
                <span style={{ marginLeft: 12, color: '#2980b9', fontWeight: 500 }}>Funds Claimed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCampaigns;
