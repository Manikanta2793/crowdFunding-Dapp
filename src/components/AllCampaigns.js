
import React, { useEffect, useState } from "react";
import "../components/AllCampaigns.css";
import { ethers } from "ethers";

const AllCampaigns = ({ walletInfo }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState("");
  const [donatingIndex, setDonatingIndex] = useState(null); // track which one is donating
  const [donationAmounts, setDonationAmounts] = useState({}); // track user input per campaign

  const getCampaigns = async () => {
    try {
      let allCampaigns = [];
      // Try to use contract from walletInfo if available, else use a read-only provider
      let contract;
      if (walletInfo?.contract) {
        contract = walletInfo.contract;
      } else if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        contract = new ethers.Contract(
          require("../utils/contractABI").contractAddress,
          require("../utils/contractABI").contractABI,
          provider
        );
      } else {
        // fallback to public RPC (e.g., Infura)
        const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/your-infura-id");
        contract = new ethers.Contract(
          require("../utils/contractABI").contractAddress,
          require("../utils/contractABI").contractABI,
          provider
        );
      }
      allCampaigns = await contract.getcampaigns();
      console.log("Raw campaigns from contract:", allCampaigns);
      const formattedCampaigns = allCampaigns.map((campaign, idx) => {
        // campaign[10] isActive: true=active, false=paused
        const now = Math.floor(Date.now() / 1000);
        const deadline = campaign[5] ? Number(campaign[5].toString()) : 0;
        let isActive = !!campaign[10] && deadline > now;
        let status = "Unknown";
        if (typeof campaign[10] !== 'undefined') {
          if (!campaign[10]) {
            status = "Not Active";
          } else if (deadline <= now) {
            status = "Not Active";
            isActive = false;
          } else {
            status = "Active";
          }
        }
        return {
          title: campaign[1],
          description: campaign[2],
          category: campaign[9] || "",
          goal: campaign[3] ? campaign[3].toString() : "0",
          amountCollected: campaign[7] ? campaign[7].toString() : "0",
          minContribution: campaign[4] ? campaign[4].toString() : "0",
          deadline: campaign[5] ? campaign[5].toString() : "0",
          status,
          isActive,
        };
      });
      setCampaigns(formattedCampaigns);
      if (formattedCampaigns.length > 0) {
        setStatus(""); // Clear error if campaigns are present
      } else {
        setStatus("No campaigns found.");
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
      setStatus("Error fetching campaigns.");
    }
  };

  const donateToCampaign = async (index, minContribution) => {
    if (!walletInfo?.contract) {
      setStatus("Connect wallet first.");
      return;
    }

    const userAmount = donationAmounts[index];
    if (!userAmount || isNaN(userAmount) || Number(userAmount) <= 0) {
      setStatus("Please enter a valid donation amount.");
      return;
    }
    // Convert minContribution and userAmount to BigInt for comparison
    const minWei = typeof minContribution === 'bigint' ? minContribution : ethers.toBigInt(minContribution);
    const userWei = ethers.parseEther(userAmount.toString());
    console.log(`userWei: ${userWei.toString()}, minWei: ${minWei.toString()}`);
    if (userWei < minWei) {
      setStatus(`Donation amount must be at least the minimum contribution: ${ethers.formatEther(minWei)} ETH (${minWei} wei)`);
      return;
    }

    try {
      setDonatingIndex(index);
      setStatus("");

      const tx = await walletInfo.contract.donateFunds(index + 1, {
        value: userWei,
      });

      await tx.wait();
      setStatus("Donation successful!");
      setDonationAmounts((prev) => ({ ...prev, [index]: "" }));
      await getCampaigns(); // refresh after donation
    } catch (error) {
      // Log the full error object for debugging
      console.error("Donation failed:", error);
      if (error?.error) {
        console.error("Nested error:", error.error);
      }
      // Handle insufficient funds error
      if (error.code === 'INSUFFICIENT_FUNDS' || (error.error && error.error.message && error.error.message.toLowerCase().includes('insufficient funds'))) {
        setStatus("You do not have enough ETH to make this donation, including gas fees.");
      } else if (
        error.code === 'CALL_EXCEPTION' &&
        error.message &&
        error.message.toLowerCase().includes('execution reverted') &&
        (error.reason === 'Value below minimum amount' || (error.message && error.message.includes('Value below minimum amount')))
      ) {
        setStatus("Donation failed: Value below minimum amount. Please enter a value equal to or greater than the minimum contribution shown.");
      } else if (error.code === 'CALL_EXCEPTION' && error.message && error.message.toLowerCase().includes('execution reverted')) {
        // Show contract revert reason if available
        if (error.reason) {
          setStatus("Transaction reverted: " + error.reason);
        } else if (error.data && error.data.message) {
          setStatus("Transaction reverted: " + error.data.message);
        } else if (error.error && error.error.message) {
          setStatus("Transaction reverted: " + error.error.message);
        } else {
          setStatus("Transaction reverted by the contract. Please check the campaign status or try again later.");
        }
      } else {
        // Show as much detail as possible
        let details = error.reason || error.message || "Unknown error";
        if (error.data && error.data.message) {
          details += " | " + error.data.message;
        }
        if (error.error && error.error.message) {
          details += " | " + error.error.message;
        }
        setStatus("Donation failed: " + details);
      }
    } finally {
      setDonatingIndex(null);
    }
  };



  useEffect(() => {
    if (walletInfo?.contract) {
      getCampaigns();
    }
  }, [walletInfo]);

  return (
    <div className="all-campaigns">
      <h2>All Campaigns</h2>
      {status && (!campaigns.length || status === "Error fetching campaigns.") && (
        <p className="status" style={{ color: "red" }}>{status}</p>
      )}
      <div className="campaigns-list">
        {campaigns.length === 0 ? (
          walletInfo?.contract ? (
            <p>No campaigns found.</p>
          ) : (
            <p style={{ color: '#3498db', fontWeight: 'bold' }}>Please connect your wallet to see the campaigns.</p>
          )
        ) : (
          campaigns.map((campaign, index) => (
            <div className="campaign-card" key={index}>
              <h3>{campaign.title}</h3>
              <p><strong>Category:</strong> {campaign.category}</p>
              <p><strong>Description:</strong> {campaign.description}</p>
              <p><strong>Goal:</strong> {ethers.formatEther(campaign.goal || "0")} ETH</p>
              <p><strong>Raised:</strong> {ethers.formatEther(campaign.amountCollected || "0")} ETH</p>
              <p>
                <strong>Min Contribution:</strong> {ethers.formatEther(campaign.minContribution || "0")} ETH
                <span style={{ fontSize: "0.85em", color: "#888" }}> ({campaign.minContribution} wei)</span>
              </p>
              <p><strong>Deadline:</strong> {campaign.deadline !== "0" ? new Date(Number(campaign.deadline) * 1000).toLocaleDateString() : "-"}</p>
              <p>
                <strong>Status:</strong>
                <span
                  style={{
                    fontWeight: 'bold',
                    color:
                      campaign.status === 'Active'
                        ? '#27ae60'
                        : campaign.status === 'Inactive'
                        ? '#e74c3c'
                        : '#888',
                    marginLeft: '8px',
                    padding: '2px 10px',
                    borderRadius: '8px',
                    background:
                      campaign.status === 'Active'
                        ? 'rgba(39, 174, 96, 0.1)'
                        : campaign.status === 'Inactive'
                        ? 'rgba(231, 76, 60, 0.1)'
                        : 'rgba(136,136,136,0.08)'
                  }}
                >
                  {campaign.status}
                </span>
              </p>
              {walletInfo?.contract ? (
                <>
                  <input
                    type="number"
                    min={ethers.formatEther(campaign.minContribution || "0")}
                    step="any"
                    placeholder={`Min: ${ethers.formatEther(campaign.minContribution || "0")}`}
                    value={donationAmounts[index] || ""}
                    onChange={e => setDonationAmounts(prev => ({ ...prev, [index]: e.target.value }))}
                    style={{
                      marginBottom: "8px",
                      width: "100%",
                      maxWidth: "350px",
                      boxSizing: "border-box",
                      padding: "10px 14px",
                      fontSize: "1rem",
                      border: "1.5px solid #3498db",
                      borderRadius: "8px",
                      outline: "none",
                      background: "#f5f7fa",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxShadow: donatingIndex === index ? "0 0 0 2px #3498db33" : "none"
                    }}
                    disabled={donatingIndex === index || !campaign.isActive}
                  />
                  <button
                    onClick={() => donateToCampaign(index, campaign.minContribution)}
                    disabled={donatingIndex === index || !campaign.isActive}
                  >
                    {donatingIndex === index ? "Donating..." : "Donate"}
                  </button>
                </>
              ) : (
                <p style={{ color: "#888", fontStyle: "italic" }}>Connect your wallet to donate.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AllCampaigns;
