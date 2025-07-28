import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import "../styles/CampaignDetails.css";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../utils/contractABI";

const CampaignDetails = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const campaigns = await contract.getAllCampaigns();
        const selected = campaigns.find((_, index) => index === parseInt(id));
        setCampaign(selected);
      } catch (err) {
        setStatus(" Failed to load campaign.");
        console.error(err);
      }
    };

    fetchCampaign();
  }, [id]);

  const handleDonate = async () => {
    try {
      if (!donationAmount) {
        setStatus("Enter a valid donation amount.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.investInCampaign(id, {
        value: ethers.parseEther(donationAmount),
      });

      await tx.wait();
      setStatus("✅ Donation successful!");
      setDonationAmount("");
    } catch (err) {
      setStatus("❌ Donation failed.");
      console.error(err);
    }
  };

  const handleClaim = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.claimFunds(id);
      await tx.wait();
      setStatus("✅ Funds claimed!");
    } catch (err) {
      setStatus("❌ Claim failed.");
      console.error(err);
    }
  };

  const handleRefund = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.requestRefund(id);
      await tx.wait();
      setStatus("✅ Refund processed!");
    } catch (err) {
      setStatus("❌ Refund failed.");
      console.error(err);
    }
  };

  if (!campaign) return <div>Loading...</div>;

  return (
    <div className="campaign-details">
      <h2>{campaign.title}</h2>
      <p><strong>Description:</strong> {campaign.description}</p>
      <p><strong>Creator:</strong> {campaign.creator}</p>
      <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal)} ETH</p>
      <p><strong>Raised:</strong> {ethers.formatEther(campaign.raisedAmount)} ETH</p>
      <p><strong>Deadline:</strong> {new Date(parseInt(campaign.deadline) * 1000).toLocaleString()}</p>

      <input
        type="text"
        placeholder="Enter amount in ETH"
        value={donationAmount}
        onChange={(e) => setDonationAmount(e.target.value)}
      />
      <button onClick={handleDonate}>Donate</button>
      <button onClick={handleClaim}>Claim Funds</button>
      <button onClick={handleRefund}>Request Refund</button>

      {status && <p className="status">{status}</p>}
    </div>
  );
};

export default CampaignDetails;
