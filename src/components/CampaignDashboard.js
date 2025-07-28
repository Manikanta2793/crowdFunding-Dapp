// src/components/CampaignDashboard.js
import React, { useEffect, useState } from "react";
import "./CampaignDashboard.css";

const CampaignDashboard = ({ walletInfo }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [txStatus, setTxStatus] = useState("");

  const fetchCreatorCampaigns = async () => {
    if (!walletInfo?.contract) return;
    try {
      const total = await walletInfo.contract.campaignCount();
      const myAddress = await walletInfo.signer.getAddress();
      const filtered = [];

      for (let i = 0; i < total; i++) {
        const c = await walletInfo.contract.campaigns(i);
        const isPaused = await walletInfo.contract.pausedCampaigns(i);
        const daysLeft = await walletInfo.contract.getDaysLeft(i);

        if (c.creator.toLowerCase() === myAddress.toLowerCase()) {
          filtered.push({
            id: c.id.toString(),
            title: c.Title,
            goal: walletInfo.signer.formatEther(c.GoalAmount),
            raised: walletInfo.signer.formatEther(await walletInfo.contract.getBalance(i)),
            daysLeft,
            isPaused,
          });
        }
      }

      setCampaigns(filtered);
    } catch (err) {
      console.error("Error loading creator campaigns:", err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setTxStatus(` ${action} in progress for campaign #${id}...`);
      let tx;
      if (action === "pause") {
        tx = await walletInfo.contract.pauseCampaign(id);
      } else if (action === "resume") {
        tx = await walletInfo.contract.resumeCampaign(id);
      } else if (action === "claim") {
        tx = await walletInfo.contract.claim(id);
      } else {
        return;
      }
      await tx.wait();
      setTxStatus(` ${action} successful for campaign #${id}`);
      fetchCreatorCampaigns();
    } catch (err) {
      console.error("Action failed:", err);
      setTxStatus(` ${action} failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchCreatorCampaigns();
  }, [walletInfo]);

  return (
    <div className="creator-dashboard">
      <h2>Your Campaigns</h2>
      {txStatus && <p className="tx-status">{txStatus}</p>}
      {campaigns.length === 0 ? (
        <p>You haven't created any campaigns.</p>
      ) : (
        campaigns.map((c) => (
          <div className="campaign" key={c.id}>
            <h3>{c.title}</h3>
            <p><strong>Goal:</strong> {c.goal} ETH</p>
            <p><strong>Raised:</strong> {c.raised} ETH</p>
            <p><strong>Days Left:</strong> {c.daysLeft}</p>
            <p><strong>Status:</strong> {c.isPaused ? "⏸ Paused" : " Active"}</p>

            <div className="actions">
              {!c.isPaused && <button onClick={() => handleAction(c.id, "pause")}>Pause</button>}
              {c.isPaused && <button onClick={() => handleAction(c.id, "resume")}>Resume</button>}
              {c.daysLeft === 0 && <button onClick={() => handleAction(c.id, "claim")}>Claim Funds</button>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CampaignDashboard;
