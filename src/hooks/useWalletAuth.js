import { useState } from 'react';
import { BrowserProvider } from 'ethers';

export const useWalletAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async (isSignup = false, signupData = null) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Check if we're on Sepolia
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError) {
          throw new Error('Please switch to Sepolia Test Network');
        }
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Get nonce from backend
      const nonceResponse = await fetch(`http://localhost:9000/api/auth/nonce/${address}`);
      const { nonce } = await nonceResponse.json();

      // Sign nonce
      const signature = await signer.signMessage(nonce);

      // If signing up, send additional user data
      const endpoint = isSignup ? 'signup-wallet' : 'verify-wallet';
      const body = isSignup 
        ? { 
            address, 
            signature, 
            username: signupData.username,
            email: signupData.email,
            role: signupData.role 
          }
        : { 
            address, 
            signature,
            email: signupData.email,
            role: signupData.role
          };

      const verifyResponse = await fetch(`http://localhost:9000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify wallet');
      }

      const { token, userId, role } = await verifyResponse.json();
      return { token, userId, role };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  return { connectWallet, isConnecting, error };
}; 