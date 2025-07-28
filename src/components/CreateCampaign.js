import React, { useState, useEffect } from "react";
import "../components/CreateCampaign.css";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/contractABI";

const CreateCampaign = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    goalAmount: "",
    minContribution: "",
    deadline: "",
  });

  const [walletInfo, setWalletInfo] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("Please install MetaMask.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      setWalletInfo({ provider, signer, contract, address: accounts[0] });
      setStatus("Wallet connected!");
    } catch (error) {
      console.error("Wallet connection error:", error);
      setStatus("Failed to connect wallet.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (
      !form.title ||
      !form.description ||
      !form.goalAmount ||
      !form.minContribution ||
      !form.deadline ||
      !form.category
    ) {
      setStatus("Please fill in all fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletInfo || !walletInfo.contract) {
      setStatus("Please connect your wallet first.");
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      setStatus("");

      const goalInWei = ethers.parseEther(form.goalAmount);
      const minInWei = ethers.parseEther(form.minContribution);
      const deadlineTimestamp = Math.floor(new Date(form.deadline).getTime() / 1000);

      // ✅ Correct order: title, description, goal, min, deadline, category
      const tx = await walletInfo.contract.createCampaign(
        form.title,
        form.description,
        goalInWei,
        minInWei,
        deadlineTimestamp,
        form.category
      );

      await tx.wait();
      setStatus("Campaign created successfully!");
      setForm({
        title: "",
        description: "",
        category: "",
        goalAmount: "",
        minContribution: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Campaign creation error:", error);
      setStatus("Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-campaign">
      <h2>Create New Campaign</h2>

      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Campaign title"
        />

        <label>Description:</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Brief description"
        />

        <label>Category:</label>
        <input
          type="text"
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Education, Health, Tech..."
        />

        <label>Goal Amount (in ETH):</label>
        <input
          type="number"
          name="goalAmount"
          value={form.goalAmount}
          onChange={handleChange}
          step="0.01"
        />

        <label>Minimum Contribution (in ETH):</label>
        <input
          type="number"
          name="minContribution"
          value={form.minContribution}
          onChange={handleChange}
          step="0.01"
        />

        <label>Deadline:</label>
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
};

export default CreateCampaign;
