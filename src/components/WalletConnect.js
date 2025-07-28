// Directory structure detected
// We'll update key components as per smart contract features and ethers v6
// Start with WalletConnect.js

// WalletConnect.js

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/contractABI';
import './WalletConnect.css';

export default function WalletConnect({ walletInfo, setWalletInfo }) {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        setCurrentAccount(accounts[0]);
        setWalletInfo({ provider, signer, address: accounts[0], contract });
        setIsConnected(true);
      } else {
        alert("Please install MetaMask.");
      }
    } catch (err) {
      if (err.code === 'ACTION_REJECTED') {
        alert("Wallet connection was rejected.");
      } else {
        alert("Error connecting wallet: " + (err.message || err));
      }
    }
  };

  const disconnectWallet = () => {
    setCurrentAccount(null);
    setWalletInfo(null);
    setIsConnected(false);
  };

  useEffect(() => {
    // Auto-connect if walletInfo exists
    if (walletInfo && walletInfo.address) {
      setCurrentAccount(walletInfo.address);
      setIsConnected(true);
    }
  }, [walletInfo]);

  return (
    <button
      onClick={isConnected ? disconnectWallet : connectWallet}
      className="connect-wallet"
      style={{ minWidth: '180px' }}
    >
      {isConnected && currentAccount
        ? `Disconnect (${currentAccount.slice(0, 6)}...)`
        : "Connect Wallet"}
    </button>
  );
}
