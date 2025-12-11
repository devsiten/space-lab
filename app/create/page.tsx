'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_IMAGE_SIZE } from '@/lib/constants';

export default function CreateTokenPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: null as File | null,
    twitter: '',
    telegram: '',
    website: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!formData.name || !formData.symbol || !formData.description || !formData.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.name.length > MAX_NAME_LENGTH) {
      toast.error(`Name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (formData.symbol.length > MAX_SYMBOL_LENGTH) {
      toast.error(`Symbol must be ${MAX_SYMBOL_LENGTH} characters or less`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your token...');

    try {
      // Upload image
      const imageFormData = new FormData();
      imageFormData.append('file', formData.image);
      
      toast.loading('Uploading image...', { id: toastId });
      const imageRes = await fetch('/api/launch/metadata', {
        method: 'POST',
        body: imageFormData
      });
      
      if (!imageRes.ok) throw new Error('Failed to upload image');
      const { imageUrl } = await imageRes.json();

      // Create token
      toast.loading('Deploying token on Solana...', { id: toastId });
      const response = await fetch('/api/launch/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          userWallet: publicKey.toString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create token');
      }
      
      const { mint, pumpFunUrl, signature } = await response.json();
      
      toast.dismiss(toastId);
      toast.success(
        <div>
          <p className="font-semibold">Token launched successfully!</p>
          <p className="text-xs text-gray-400 mt-1">CA: {mint.slice(0, 8)}...{mint.slice(-8)}</p>
          <div className="flex gap-2 mt-2">
            <a 
              href={pumpFunUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:underline"
            >
              View on Pump.fun →
            </a>
            <a 
              href={`https://solscan.io/tx/${signature}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:underline"
            >
              Transaction →
            </a>
          </div>
        </div>,
        { duration: 10000 }
      );
      
      router.push(`/token/${mint}`);
      
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to create token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#131314] border border-[#1F1F22] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create a new token</h1>
          <p className="text-gray-400 mb-8">
            Launch fee: 0.02 SOL • Deployed with our authority • Appears on Pump.fun
          </p>
          
          <div className="space-y-6">
            {/* Name & Symbol */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors"
                  placeholder="Doge Killer"
                  maxLength={MAX_NAME_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.name.length}/{MAX_NAME_LENGTH}</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors"
                  placeholder="DKILL"
                  maxLength={MAX_SYMBOL_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.symbol.length}/{MAX_SYMBOL_LENGTH}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors resize-none"
                rows={4}
                placeholder="Describe your token's mission..."
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Image <span className="text-red-500">*</span>
              </label>
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
                  className="flex items-center justify-center w-full h-40 bg-[#0A0A0B] border-2 border-dashed border-[#1F1F22] rounded-xl cursor-pointer hover:border-purple-600 transition-colors overflow-hidden"
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400">Click to upload</p>
                      <p className="text-gray-500 text-xs mt-1">PNG, JPG, GIF (max 2MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Social Links (optional)</h3>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Twitter
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors"
                  placeholder="https://twitter.com/yourtoken"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Telegram
                </label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors"
                  placeholder="https://t.me/yourgroup"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F22] rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none transition-colors"
                  placeholder="https://yourtoken.com"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4">
              <h4 className="text-purple-400 font-semibold text-sm mb-2">💡 What happens when you launch?</h4>
              <ul className="text-purple-200 text-xs space-y-1">
                <li>• Token is deployed with OUR platform wallet as authority</li>
                <li>• Token appears on Pump.fun automatically</li>
                <li>• Anyone can buy/sell through Jupiter (we earn 0.5% referral)</li>
                <li>• Token graduates to Raydium at ~$69K market cap</li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
              <p className="text-yellow-400 font-semibold text-sm mb-1">⚠️ Important</p>
              <p className="text-yellow-200 text-xs">
                Token will be permanently deployed on Solana. This action cannot be undone.
                Make sure all information is correct before proceeding.
              </p>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading || !connected || !formData.name || !formData.symbol || !formData.description || !formData.image}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating token...
                </span>
              ) : connected ? (
                'Create Token (0.02 SOL)'
              ) : (
                'Connect Wallet to Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
