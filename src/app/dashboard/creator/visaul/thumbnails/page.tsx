//dashboard/thumbanils
'use client';

import { Upload, User, ImagePlus, X, Loader2, Download, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react'; 
import Image from 'next/image';
import axios from 'axios';
import ThumbnailList from '../../../../../../components/thumbnaill';
import Link from 'next/link';
import { useToast } from '../../../../../../hooks/use-toast';
import { useSession } from '../../../../../../lib/auth-client';

export default function ThumbnailGeneratorPage() {
  const [inputUser, setInputUser] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<any>();
  const [includeFace, setIncludeFace] = useState<any>();
  const [referenceImagePreview, setReferenceImagePreview] = useState<string>();
  const [includeFacePreview, setIncludeFacePreview] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [outputThumbnailImage, setOutputThumbnailImage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  
  // Get session from Better Auth
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const userEmail = session?.user?.email;

  const handleFileChange = (field: string, e: any) => {
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
  }

  const clearPreviews = () => {
    if (referenceImagePreview) URL.revokeObjectURL(referenceImagePreview);
    if (includeFacePreview) URL.revokeObjectURL(includeFacePreview);
    setReferenceImagePreview(undefined);
    setIncludeFacePreview(undefined);
    setReferenceImage(null);
    setIncludeFace(null);
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
    
    try {
      const result = await axios.post('/api/generate-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const thumbnailUrl = result.data.thumbnailUrl;
      setOutputThumbnailImage(thumbnailUrl);
      
      // Clear the form
      setInputUser('');
      clearPreviews();
      
      toast({
        title: "Success",
        description: "Thumbnail generated successfully!",
      });
      
      // Trigger refresh of thumbnail list
      setRefreshTrigger(prev => prev + 1);
      
    } catch (e: any) {
      console.error('Generation error:', e);
      toast({
        title: "Error",
        description: e.response?.data?.error || "Failed to generate thumbnail. Please try again.",
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

      toast({
        title: "Success",
        description: "Thumbnail download started",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download thumbnail",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 px-4 py-8 transition-colors duration-300">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-700 bg-clip-text text-transparent">
            AI Thumbnail Generator
          </h1>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Turn any video into a click magnet with thumbnails that grab attention and drive views.
          </p>
          {!isLoggedIn && (
            <Link href="/auth">
              <button className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                Login to Generate
              </button>
            </Link>
          )}
          {isLoggedIn && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-pink-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-700">
                Logged in as: <span className="font-semibold text-pink-600">{userEmail}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Preview Section */}
      <div className="flex justify-center items-center max-w-4xl mx-auto mb-8">
        {loading ? (
          <div className="h-[250px] bg-white border-2 border-pink-200 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-xl">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-rose-200 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <h2 className="text-lg font-medium mt-4 text-gray-800">Generating your thumbnail...</h2>
            <p className="text-sm text-gray-500 mt-1">This usually takes less than a minute</p>
          </div>
        ) : (
          <div className="relative group w-full max-w-2xl">
            {outputThumbnailImage ? (
              <>
                <div className="relative overflow-hidden rounded-2xl shadow-xl border-4 border-white bg-white">
                  <Image 
                    src={outputThumbnailImage} 
                    alt='AI generated thumbnail'
                    width={600} 
                    height={400} 
                    className='aspect-video w-full object-cover'
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                    <button
                      onClick={downloadThumbnail}
                      className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full font-medium shadow-lg hover:bg-gray-50 hover:scale-105 active:scale-95"
                    >
                      <Download className="h-5 w-5 text-pink-600" />
                      Download
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[250px] bg-white border-2 border-dashed border-pink-300 rounded-2xl flex flex-col items-center justify-center w-full p-8 shadow-lg">
                <div className="p-3 bg-pink-100 rounded-full mb-4">
                  <ImagePlus className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 text-center">Your thumbnail will appear here</h3>
                <p className="text-sm text-gray-500 text-center mt-1">Enter a description or upload images to generate a thumbnail</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="max-w-4xl mx-auto">
        {/* Textarea with upload */}
        <div className="relative mb-8">
          <textarea
            id="description"
            rows={4}
            value={inputUser}
            placeholder="Describe your video content or enter your video title..."
            onChange={(e) => setInputUser(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isLoggedIn || loading}
            className="w-full px-5 py-4 pr-14 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-base bg-white text-gray-800 placeholder-gray-400 resize-none transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !isLoggedIn || (!inputUser && !referenceImage && !includeFace)}
            className="absolute right-3 bottom-3 text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 p-3 cursor-pointer rounded-full shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title="Generate thumbnail"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </button>
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <label htmlFor="referenceimage" className="flex-1">
            {!referenceImagePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-pink-300 rounded-xl hover:border-pink-500 text-gray-700 w-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 cursor-pointer bg-white group relative overflow-hidden ${!isLoggedIn || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-rose-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-2 bg-pink-100 rounded-full group-hover:bg-pink-200 transition-colors z-10">
                  <ImagePlus className="w-5 h-5 text-pink-600" />
                </div>
                <span className="font-medium z-10">Reference Image</span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden group cursor-pointer border-2 border-pink-400 bg-white'>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-20 shadow-md hover:bg-red-600 transition-colors' 
                  onClick={(e) => {
                    e.preventDefault();
                    setReferenceImagePreview(undefined);
                    setReferenceImage(null);
                  }}
                />
                <Image 
                  src={referenceImagePreview} 
                  alt='referenceImagepreview' 
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
            disabled={!isLoggedIn || loading}
          />
          
          <label htmlFor="includeface" className="flex-1">
            {!includeFacePreview ? (
              <div className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-pink-300 rounded-xl hover:border-pink-500 text-gray-700 w-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-100 cursor-pointer bg-white group relative overflow-hidden ${!isLoggedIn || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-rose-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-2 bg-pink-100 rounded-full group-hover:bg-pink-200 transition-colors z-10">
                  <User className="w-5 h-5 text-pink-600" />
                </div>
                <span className="font-medium z-10">Include Face</span>
              </div>
            ) : (
              <div className='relative h-24 w-full rounded-xl overflow-hidden group cursor-pointer border-2 border-pink-400 bg-white'>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
                  <span className="text-white text-sm font-medium">Change Image</span>
                </div>
                <X 
                  className='absolute top-2 right-2 h-5 w-5 p-1 bg-red-500 text-white rounded-full cursor-pointer z-20 shadow-md hover:bg-red-600 transition-colors' 
                  onClick={(e) => {
                    e.preventDefault();
                    setIncludeFacePreview(undefined);
                    setIncludeFace(null);
                  }}
                />
                <Image 
                  src={includeFacePreview} 
                  alt='includeFaceimagepreview' 
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
            disabled={!isLoggedIn || loading}
          />
        </div>

        {/* Clear Form Button */}
        {(inputUser || referenceImagePreview || includeFacePreview) && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setInputUser('');
                clearPreviews();
                setOutputThumbnailImage('');
              }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors hover:underline"
            >
              Clear Form
            </button>
          </div>
        )}
      </div>
      
      <ThumbnailList refreshTrigger={refreshTrigger} />
    </div>
  );
}