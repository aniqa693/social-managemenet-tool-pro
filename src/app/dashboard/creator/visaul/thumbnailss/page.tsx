'use client';

import { Upload, User, ImagePlus, X, Loader2, Download, Sparkles } from 'lucide-react';
import { useState } from 'react'; 
import Image from 'next/image';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from '../../../../../../lib/auth-client';
import { useToast } from '../../../../../../hooks/use-toast';

// Simple Toast Display Component
function ToastDisplay({ message, onClose }: { message: any; onClose: () => void }) {
  if (!message) return null;
  
  const bgColor = message.variant === 'destructive' ? 'bg-red-600' : 'bg-green-600';
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-md`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{message.title}</h3>
            {message.description && (
              <p className="text-sm mt-1 opacity-90">{message.description}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-4 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThumbnailGeneratorPage() {
  const [inputUser, setInputUser] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [includeFace, setIncludeFace] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState('');
  const [includeFacePreview, setIncludeFacePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [outputThumbnailImage, setOutputThumbnailImage] = useState('');
  const { toast, message: toastMessage } = useToast();
  
  // Get session from Better Auth
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const userEmail = session?.user?.email;

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    if (field === 'referenceimage') {
      setReferenceImage(file);
      setReferenceImagePreview(previewUrl);
    } else if (field === 'includeimage') {
      setIncludeFace(file);
      setIncludeFacePreview(previewUrl);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please login to generate thumbnails",
        variant: "destructive",
      });
      return;
    }

    if (!inputUser && !referenceImage && !includeFace) {
      toast({
        title: "Input required",
        description: "Please provide a description or upload images",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    if (inputUser) formData.append('description', inputUser);
    if (referenceImage) formData.append('referenceImage', referenceImage);
    if (includeFace) formData.append('includeFace', includeFace);
    
    // Add user email to headers
    const headers: any = {};
    if (userEmail) {
      headers['x-user-email'] = userEmail;
    }
    
    try {
      const result = await axios.post('/api/generate-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers
        },
      });
      
      const thumbnailUrl = result.data.thumbnail?.thumbnailURL || result.data.thumbnailUrl;
      setOutputThumbnailImage(thumbnailUrl);
      
      toast({
        title: "Success",
        description: "Thumbnail generated successfully!",
      });
      
      // Refresh the thumbnail list after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (e: any) {
      console.error('Generation error:', e);
      toast({
        title: "Error",
        description: e.response?.data?.error || "Failed to generate thumbnail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const downloadThumbnail = async () => {
    if (!outputThumbnailImage) {
      toast({
        title: "Error",
        description: "No thumbnail to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(outputThumbnailImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-thumbnail-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download thumbnail",
        variant: "destructive",
      });
    }
  };

  const clearPreview = (type: string) => {
    if (type === 'reference') {
      if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
      setReferenceImage(null);
      setReferenceImagePreview('');
    } else {
      if (includeFacePreview) URL.revokeObjectURL(includeFacePreview);
      setIncludeFace(null);
      setIncludeFacePreview('');
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black px-4 py-8">
      {/* Toast Notification */}
      <ToastDisplay 
        message={toastMessage} 
        onClose={() => toastMessage && useToast().toast({ title: '' })} 
      />

      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            AI Thumbnail Generator
          </h1>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Turn any video into a click magnet with thumbnails that grab attention and drive views.
          </p>
          {!isLoggedIn && (
            <Link href="/auth">
              <button className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors">
                Login to Generate
              </button>
            </Link>
          )}
          {isLoggedIn && (
            <p className="text-sm text-orange-400">
              Logged in as: {userEmail}
            </p>
          )}
        </div>
      </div>

      {/* Thumbnail Preview Section */}
      <div className="flex justify-center items-center max-w-4xl mx-auto mb-8">
        {loading ? (
          <div className="h-[250px] bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl flex flex-col items-center justify-center w-full p-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <h2 className="text-lg font-medium mt-4 text-gray-300">Generating your thumbnail...</h2>
            <p className="text-sm text-gray-400 mt-1">This takes less than a minute</p>
          </div>
        ) : (
          <div className="relative group w-full max-w-2xl">
            {outputThumbnailImage ? (
              <div className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-gray-800">
                <Image 
                  src={outputThumbnailImage} 
                  alt='AI generated thumbnail'
                  width={600} 
                  height={400} 
                  className='aspect-video w-full object-cover'
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                  <button
                    onClick={downloadThumbnail}
                    className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
                  >
                    <Download className="h-5 w-5" />
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[250px] bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center w-full p-8">
                <div className="p-3 bg-orange-900/30 rounded-full mb-4">
                  <ImagePlus className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300">Your thumbnail will appear here</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          <textarea
            rows={4}
            value={inputUser}
            placeholder="Describe your video content or enter your video title..."
            onChange={(e) => setInputUser(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isLoggedIn}
            className="w-full px-5 py-4 pr-14 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-gray-800 text-white placeholder-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !isLoggedIn || (!inputUser && !referenceImage && !includeFace)}
            className="absolute right-3 bottom-3 bg-gradient-to-r from-orange-600 to-orange-700 p-3 rounded-full disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <label htmlFor="referenceimage" className="flex-1">
            {!referenceImagePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-orange-700 rounded-xl bg-gray-800 text-gray-300 ${!isLoggedIn ? 'opacity-50' : 'cursor-pointer hover:border-orange-500'}`}>
                <ImagePlus className="w-5 h-5 text-orange-400" />
                <span>Reference Image</span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden border-2 border-orange-700'>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-10' 
                  onClick={(e) => {
                    e.preventDefault();
                    clearPreview('reference');
                  }}
                />
                <Image 
                  src={referenceImagePreview} 
                  alt='preview' 
                  fill
                  className='object-cover'
                />
              </div>
            )}
          </label>
          <input 
            type="file" 
            id='referenceimage' 
            className='hidden' 
            onChange={(e) => handleFileChange('referenceimage', e)}
            disabled={!isLoggedIn}
            accept="image/*"
          />
          
          <label htmlFor="includeface" className="flex-1">
            {!includeFacePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-orange-700 rounded-xl bg-gray-800 text-gray-300 ${!isLoggedIn ? 'opacity-50' : 'cursor-pointer hover:border-orange-500'}`}>
                <User className="w-5 h-5 text-orange-400" />
                <span>Include Face</span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden border-2 border-orange-700'>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-10' 
                  onClick={(e) => {
                    e.preventDefault();
                    clearPreview('face');
                  }}
                />
                <Image 
                  src={includeFacePreview} 
                  alt='preview' 
                  fill
                  className='object-cover'
                />
              </div>
            )}
          </label>
          <input 
            type="file" 
            id='includeface' 
            className='hidden' 
            onChange={(e) => handleFileChange('includeimage', e)}
            disabled={!isLoggedIn}
            accept="image/*"
          />
        </div>
      </div>
      
      {/* Add this CSS to your global styles or component */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}