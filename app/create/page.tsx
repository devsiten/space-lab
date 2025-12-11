'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import toast from 'react-hot-toast';
import { TokenCard } from '../components/TokenCard';

export default function CreateTokenPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    description: '',
    image: null as File | null,
    imagePreview: '',
    twitter: '',
    telegram: '',
    website: '',
    tags: [] as string[]
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Initializing launch sequence...');

    try {
      // simulate delay for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Token launched successfully!', { id: toastId });
      router.push('/');
    } catch (error) {
      console.error('Launch error:', error);
      toast.error('Failed to launch token', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Preview Token Data
  const previewToken = {
    mint: 'preview',
    name: formData.name || 'Token Name',
    symbol: formData.ticker || 'TICKER',
    image: formData.imagePreview,
    price: 0.0000001,
    price24hAgo: 0.0000001,
    marketCap: 5000,
    volume24h: 1000,
    holders: 1,
    createdAt: new Date().toISOString(),
    creatorWallet: publicKey ? publicKey.toString() : 'Wallet not connected',
    platform: 'Space Lab',
    graduated: false
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">

        {/* Left Column: Form */}
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Launch your token</h1>
            <p className="text-gray-400 text-lg">Launch free • Your token goes live instantly</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Card */}
            <div className="glass-panel p-8 rounded-2xl space-y-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">1</span>
                Token Details
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Token Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Space Doge"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ticker Symbol</label>
                  <input
                    type="text"
                    required
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder="e.g. DOGE"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all placeholder:text-gray-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-violet-500/50 transition-all text-sm text-gray-400"
                    >
                      {formData.image ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your token's mission..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all placeholder:text-gray-600 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Socials Card */}
            <div className="glass-panel p-8 rounded-2xl space-y-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowOptions(!showOptions)}
              >
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">2</span>
                  Social Links <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                </h2>
                <span className={`text-gray-400 transition-transform ${showOptions ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {showOptions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Twitter</label>
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="https://x.com/..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Telegram Channel</label>
                    <input
                      type="url"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      placeholder="https://t.me/..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Launch Button */}
            <div className="pt-4">
              {!publicKey ? (
                <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-0.5">
                  <WalletMultiButton className="!w-full !justify-center !bg-transparent !h-14 !text-lg !font-bold" />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary h-16 text-xl font-bold shadow-xl shadow-violet-600/20"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Launching...
                    </div>
                  ) : (
                    '🚀 Launch Token'
                  )}
                </button>
              )}
              <p className="text-center text-sm text-gray-500 mt-4">
                Cost to deploy: <span className="text-green-400 font-bold">~0.02 SOL</span> (Free Launch)
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Preview */}
        <div className="hidden lg:block sticky top-24 h-fit">
          <h2 className="text-xl font-bold text-gray-400 mb-6 uppercase tracking-wider text-center">Live Preview</h2>
          <div className="max-w-sm mx-auto transform hover:scale-105 transition-transform duration-500">
            <TokenCard token={previewToken} />

            {/* Preview Badge Info */}
            <div className="mt-8 p-6 glass-panel rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                🛡️
              </div>
              <h3 className="text-white font-bold text-lg"> Safe & Fair Launch</h3>
              <ul className="text-sm text-gray-400 space-y-3 text-left pl-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> No presale
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> No team allocation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Freeze authority revoked
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Mint authority revoked
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
