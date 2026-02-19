//compnent/thubnaill
import { Skeleton } from '@/components/ui/skeleton'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Download, Eye, Sparkles, RefreshCw } from 'lucide-react'
import { useSession } from '../lib/auth-client'

type Thumbnail = {
  id: number,
  thumbnailURL: string,
  refImage: string,
  includeImage: string,
  userInput: string
}

function ThumbnailList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [thumbnailList, setThumbnailList] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const getThumbnailList = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true)
    try {
      const result = await axios.get('/api/generate-thumbnail')
      setThumbnailList(result.data)
      console.log('📋 Loaded thumbnails:', result.data.length)
    } catch (error) {
      console.error('Error fetching thumbnails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      getThumbnailList();
    }
  }, [isLoggedIn, refreshTrigger]);

  const downloadThumbnail = async (thumbnailURL: string, id: number) => {
    try {
      const response = await fetch(thumbnailURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thumbnail-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className='mt-10 px-4'>
        <div className='text-center py-12 bg-white rounded-2xl shadow-lg border border-pink-100'>
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-pink-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">Login to view your thumbnails</h3>
          <p className="text-gray-500 mt-1">Please login to see your previously generated thumbnails.</p>
          <Link href="/auth">
            <button className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full hover:from-pink-700 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 px-4'>
      <div className='flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-md border border-pink-100'>
        <div className='flex items-center gap-2'>
          <div className="p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
            <Sparkles className='h-5 w-5 text-pink-600' />
          </div>
          <h2 className='font-bold text-xl text-gray-800'>
            Previously Generated Thumbnails
          </h2>
          <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full ml-2">
            {thumbnailList.length}
          </span>
        </div>
        <button 
          onClick={getThumbnailList}
          className="p-2 bg-pink-100 rounded-full hover:bg-pink-200 transition-colors"
          title="Refresh"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 text-pink-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {loading ? 
          [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col space-y-3 bg-white p-3 rounded-xl shadow-lg border border-pink-100">
              <Skeleton className="h-40 w-full rounded-lg bg-pink-100" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-pink-100" />
                <Skeleton className="h-4 w-3/4 bg-pink-100" />
              </div>
            </div>
          )) : 
          thumbnailList.length > 0 ? (
            thumbnailList.map((thumbnail) => (
              thumbnail.thumbnailURL && (
                <div key={thumbnail.id} className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-pink-100">
                  <div className="relative aspect-video">
                    <Image 
                      src={thumbnail.thumbnailURL} 
                      alt={thumbnail.userInput || 'AI generated thumbnail'}
                      width={300}
                      height={180}
                      className='w-full h-full object-cover'
                      priority={thumbnailList.indexOf(thumbnail) < 4}
                      onError={(e) => {
                        console.error('Image failed to load:', thumbnail.thumbnailURL);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Link 
                          href={thumbnail.thumbnailURL} 
                          target='_blank'
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="View full size"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </Link>
                        <button 
                          onClick={() => downloadThumbnail(thumbnail.thumbnailURL, thumbnail.id)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                          title="Download thumbnail"
                        >
                          <Download className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-white to-pink-50">
                    <p className="text-sm text-gray-700 truncate font-medium">
                      {thumbnail.userInput || 'AI generated thumbnail'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        ID: {thumbnail.id}
                      </span>
                      <span className="text-xs text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </div>
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg border border-pink-100">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4">
                <Sparkles className="h-12 w-12 text-pink-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No thumbnails yet</h3>
              <p className="text-gray-500">Generate your first thumbnail to see it here!</p>
            </div>
          )
        }
      </div>
    </div>
  )
}

export default ThumbnailList