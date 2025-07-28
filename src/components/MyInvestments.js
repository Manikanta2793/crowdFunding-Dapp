// components/MyInvestments.js
import React, { useEffect, useState } from "react";
import { formatEther } from "ethers";
import "./MyInvestments.css";

const MyInvestments = ({ walletInfo }) => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInvestments = async () => {
    setLoading(true);
    setError("");

    try {
      if (!walletInfo || !walletInfo.contract || !walletInfo.signer) {
        setError("Wallet not connected.");
        return;
      }

      const address = await walletInfo.signer.getAddress();
      const campaigns = await walletInfo.contract.getMyInvestments(address);
      console.log("getMyInvestments returned:", campaigns);
      // For each campaign, fetch the user's actual invested amount
      const investmentsWithAmount = await Promise.all(
        campaigns.map(async (c, index) => {
          let invested = "0";
          try {
            invested = await walletInfo.contract.getContribution(c.id, address);
            console.log(`getContribution for campaign id ${c.id}, address ${address}:`, invested?.toString?.() ?? invested);
          } catch (e) {
            console.warn(`getContribution failed for campaign id ${c.id}, address ${address}:`, e);
            invested = "0";
          }
          return {
            id: c.id?.toString() ?? index,
            title: c.Title || c.title || '',
            amount: invested ? formatEther(invested) : "0",
            category: c.category || '',
            date: c.deadline ? new Date(Number(c.deadline) * 1000).toLocaleDateString() : "-",
          };
        })
      );
      // Show all investments, including those with zero amount
      console.log("investmentsWithAmount:", investmentsWithAmount);
      setInvestments(investmentsWithAmount);
    } catch (err) {
      console.error(err);
      setError("Failed to load investments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletInfo?.contract) {
      fetchInvestments();
    }
  }, [walletInfo]);

  return (
    <div className="my-investments-container">
      <h2>My Investments</h2>
      {loading ? (
        <p>Loading investments...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : investments.length === 0 ? (
        <p>No investments found.</p>
      ) : (
        <ul className="investment-list">
          {investments.map((inv) => (
            <li key={inv.id} className="investment-item" style={{ opacity: parseFloat(inv.amount) === 0 ? 0.5 : 1 }}>
              <h3>{inv.title}</h3>
              <p><strong>Amount:</strong> {inv.amount} ETH {parseFloat(inv.amount) === 0 && <span style={{color:'red'}}>(No investment)</span>}</p>
              <p><strong>Category:</strong> {inv.category}</p>
              <p><strong>Date:</strong> {inv.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyInvestments;