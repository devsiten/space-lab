'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { formatNumber } from '@/lib/utils';
import { QUICK_BUY_AMOUNTS, LAMPORTS_PER_SOL } from '@/lib/constants';

interface TradingPanelProps {
  token: {
    mint: string;
    symbol: string;
    name: string;
    price: number;
  };
}

export function TradingPanel({ token }: TradingPanelProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Debounced quote fetching
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(() => {
      getQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, activeTab, token.mint]);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setQuoteLoading(true);
    try {
      const res = await fetch('/api/trade/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMint: activeTab === 'buy' 
            ? 'So11111111111111111111111111111111111111112' 
            : token.mint,
          outputMint: activeTab === 'buy' 
            ? token.mint 
            : 'So11111111111111111111111111111111111111112',
          amount: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
    } finally {
      setQuoteLoading(false);
    }
  };

  const executeTrade = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter an amount');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`${activeTab === 'buy' ? 'Buying' : 'Selling'} ${token.symbol}...`);

    try {
      const endpoint = activeTab === 'buy' ? '/api/trade/buy' : '/api/trade/sell';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: token.mint,
          amount: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
          userWallet: publicKey.toString()
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create transaction');
      }
      
      const { transaction, referralEarning } = await res.json();
      
      // Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(transaction, 'base64');
      const tx = VersionedTransaction.deserialize(swapTransactionBuf);
      
      const signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.dismiss(toastId);
      toast.success(
        <div>
          <p className="font-semibold">
            {activeTab === 'buy' ? 'Bought' : 'Sold'} successfully!
          </p>
          <a 
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:underline"
          >
            View transaction →
          </a>
        </div>
      );
      
      setAmount('');
      setQuote(null);
      
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-6">
      {/* Buy/Sell Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('buy');
            setAmount('');
            setQuote(null);
          }}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-[#0A0A0B] text-gray-400 hover:text-white border border-[#1F1F22]'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => {
            setActiveTab('sell');
            setAmount('');
            setQuote(null);
          }}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-[#0A0A0B] text-gray-400 hover:text-white border border-[#1F1F22]'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">
          You pay ({activeTab === 'buy' ? 'SOL' : token.symbol})
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white text-lg focus:border-purple-600 focus:outline-none transition-colors pr-32"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            {QUICK_BUY_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className="text-xs bg-[#1F1F22] hover:bg-purple-600/20 px-2 py-1 rounded text-gray-400 hover:text-white transition-colors"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote Display */}
      {(quote || quoteLoading) && (
        <div className="mb-4 p-4 bg-[#0A0A0B] rounded-xl space-y-2">
          {quoteLoading ? (
            <div className="flex items-center justify-center py-2">
              <svg className="animate-spin h-5 w-5 text-purple-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-2 text-gray-400 text-sm">Getting best price...</span>
            </div>
          ) : quote && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">You receive</span>
                <span className="text-white font-semibold">
                  {formatNumber(quote.outAmount / LAMPORTS_PER_SOL)} {activeTab === 'buy' ? token.symbol : 'SOL'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price impact</span>
                <span className={quote.priceImpactPct > 3 ? 'text-red-500' : 'text-gray-400'}>
                  {(quote.priceImpactPct || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Platform fee</span>
                <span className="text-purple-400">0.5%</span>
              </div>
              {quote.route && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Route</span>
                  <span className="text-gray-400 text-xs">{quote.route}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={executeTrade}
        disabled={!amount || loading || !connected || quoteLoading}
        className={`w-full py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:transform-none ${
          activeTab === 'buy'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-700'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-700'
        } text-white disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : connected ? (
          `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
        ) : (
          'Connect Wallet'
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Powered by Jupiter • Best price guaranteed • 0.5% platform fee
      </p>
    </div>
  );
}
