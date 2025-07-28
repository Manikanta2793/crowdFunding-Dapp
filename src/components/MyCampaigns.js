import React, { useEffect, useState } from "react";
import "../components/MyCampaigns.css";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/contractABI";

const MyCampaigns = () => {
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [walletInfo, setWalletInfo] = useState(null);
  const [status, setStatus] = useState("");
  const [userAddress, setUserAddress] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not found.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const address = await signer.getAddress();

      setWalletInfo({ provider, signer, contract });
      setUserAddress(address);
    } catch (err) {
      console.error("Connection error:", err);
      setStatus("Failed to connect wallet.");
    }
  };

  const loadMyCampaigns = async () => {
    try {
      if (!userAddress) return;
      const campaigns = await walletInfo.contract.getMyCampaigns(userAddress);
      // Map by tuple index, not property name
      // [id, Title, Description, GoalAmount, MinimumAmount, deadline, Creator_address, fundsRaised, claimedStatus, category, isActive]
      const formattedCampaigns = campaigns.map((campaign, idx) => ({
        title: campaign[1],
        description: campaign[2],
        category: campaign[9] || "",
        goal: campaign[3] ? campaign[3].toString() : "0",
        amountCollected: campaign[7] ? campaign[7].toString() : "0",
        minContribution: campaign[4] ? campaign[4].toString() : "0",
        deadline: campaign[5] ? campaign[5].toString() : "0",
      }));
      setMyCampaigns(formattedCampaigns);
    } catch (err) {
      console.error("Error loading campaigns:", err);
      setStatus("Could not fetch your campaigns.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (walletInfo?.contract && userAddress) {
      loadMyCampaigns();
    }
  }, [walletInfo, userAddress]);

  return (
    <div className="my-campaigns">
      <h2>My Campaigns</h2>
      {status && <p className="status">{status}</p>}
      <div className="my-campaigns-list">
        {myCampaigns.map((campaign, index) => (
          <div className="my-campaign-card" key={index}>
            <h3>{campaign.title}</h3>
            <p><strong>Category:</strong> {campaign.category}</p>
            <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal || "0")} ETH</p>
            <p><strong>Raised:</strong> {ethers.formatEther(campaign.amountCollected || "0")} ETH</p>
            <p><strong>Min Contribution:</strong> {ethers.formatEther(campaign.minContribution || "0")} ETH</p>
            <p><strong>Deadline:</strong> {campaign.deadline !== "0" ? new Date(Number(campaign.deadline) * 1000).toLocaleDateString() : "N/A"}</p>
            <p><strong>Description:</strong> {campaign.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCampaigns;
