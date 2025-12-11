'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import toast from 'react-hot-toast';

export default function LaunchToken() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    twitter: '',
    telegram: '',
    website: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!form.name || !form.symbol || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your token...');

    try {
      // Step 1: Get transaction from API
      const res = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userWallet: publicKey.toString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      const data = await res.json();

      // Step 2: User signs transaction
      toast.loading('Please sign the transaction in your wallet...', { id: toastId });

      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
      const signedTx = await signTransaction(transaction);

      // Step 3: Send transaction
      toast.loading('Sending transaction...', { id: toastId });

      const signature = await connection.sendRawTransaction(signedTx.serialize());

      // Step 4: Confirm transaction
      toast.loading('Confirming transaction...', { id: toastId });

      await connection.confirmTransaction(signature, 'confirmed');

      // Step 5: Save to database
      await fetch('/api/launch/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: data.mint,
          name: form.name,
          symbol: form.symbol,
          description: form.description,
          image: form.image,
          twitter: form.twitter,
          telegram: form.telegram,
          website: form.website,
          userWallet: publicKey.toString(),
          signature,
        }),
      });

      toast.success(
        <div>
          <p className="font-bold">Token launched successfully! 🚀</p>
          <p className="text-sm">Mint: {data.mint.slice(0, 8)}...</p>
        </div>,
        { id: toastId, duration: 5000 }
      );

      // Reset form
      setForm({
        name: '',
        symbol: '',
        description: '',
        image: '',
        twitter: '',
        telegram: '',
        website: '',
      });

      // Redirect to token page
      window.location.href = `/token/${data.mint}`;

    } catch (error: any) {
      console.error('Launch failed:', error);
      toast.error(error.message || 'Failed to launch token', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Launch Your Token</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 mb-2">Token Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
            placeholder="e.g. Space Doge"
            maxLength={32}
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Symbol *</label>
          <input
            type="text"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
            placeholder="e.g. SDOGE"
            maxLength={10}
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white h-32"
            placeholder="Describe your token..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Image URL</label>
          <input
            type="url"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Twitter</label>
            <input
              type="text"
              value={form.twitter}
              onChange={(e) => setForm({ ...form, twitter: e.target.value })}
              className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
              placeholder="@handle"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Telegram</label>
            <input
              type="text"
              value={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
              className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
              placeholder="t.me/..."
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white"
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !connected}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-bold py-4 rounded-xl transition-colors"
        >
          {loading ? 'Launching...' : connected ? 'Launch Token 🚀' : 'Connect Wallet First'}
        </button>
      </form>
    </div>
  );
}
