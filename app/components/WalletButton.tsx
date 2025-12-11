'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';
import { shortenAddress } from '@/lib/utils';

export function WalletButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClick = () => {
    if (connected) {
      setShowDropdown(!showDropdown);
    } else {
      setVisible(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={connecting}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
      >
        {connecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </>
        ) : connected && publicKey ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {shortenAddress(publicKey.toString())}
          </>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && connected && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-[#131314] border border-[#1F1F22] rounded-xl shadow-lg z-20 overflow-hidden">
            <button
              onClick={handleCopyAddress}
              className="w-full px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-[#1F1F22] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Address
            </button>
            <a
              href={`https://solscan.io/account/${publicKey?.toString()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-3 text-left text-gray-400 hover:text-white hover:bg-[#1F1F22] transition-colors flex items-center gap-2"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Solscan
            </a>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 text-left text-red-400 hover:text-red-300 hover:bg-[#1F1F22] transition-colors flex items-center gap-2 border-t border-[#1F1F22]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
