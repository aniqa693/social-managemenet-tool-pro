import { Skeleton } from '@/components/ui/skeleton'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Download, Eye, Sparkles } from 'lucide-react'
import { useSession } from '../lib/auth-client'

type Thumbnail = {
  id: number,
  thumbnailURL: string,
  refImage: string,
  includeImage: string,
  userInput: string
}

function ThumbnailList() {
  const [thumbnailList, setThumbnailList] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (isLoggedIn) {
      getThumbnailList();
    }
  }, [isLoggedIn])

  const getThumbnailList = async () => {
    setLoading(true)
    try {
      const result = await axios.get('/api/generate-thumbnail')
      setThumbnailList(result.data)
    } catch (error) {
      console.error('Error fetching thumbnails:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className='text-center py-12'>
          <div className="mx-auto w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">Login to view your thumbnails</h3>
          <p className="text-gray-500 mt-1">Please login to see your previously generated thumbnails.</p>
          <Link href="/auth">
            <button className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 px-4'>
      <div className='flex items-center gap-2 mb-6'>
        <Sparkles className='h-6 w-6 text-orange-500' />
        <h2 className='font-bold text-2xl bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent'>
          Previously Generated Thumbnails
        </h2>
      </div>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {loading ? 
          [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="flex flex-col space-y-3 bg-gray-800 p-3 rounded-xl shadow">
              <Skeleton className="h-40 w-full rounded-lg bg-gray-700" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-700" />
                <Skeleton className="h-4 w-3/4 bg-gray-700" />
              </div>
            </div>
          )) : 
          thumbnailList.map((thumbnail) => (
            thumbnail.thumbnailURL && (
              <div key={thumbnail.id} className="group relative bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="relative">
                  <Image 
                    src={thumbnail.thumbnailURL} 
                    alt={thumbnail.thumbnailURL}
                    width={300}
                    height={180}
                    className='w-full aspect-video object-cover'
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-3">
                      <Link 
                        href={thumbnail.thumbnailURL} 
                        target='_blank'
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="View full size"
                      >
                        <Eye className="h-5 w-5 text-gray-800" />
                      </Link>
                      <button 
                        onClick={() => downloadThumbnail(thumbnail.thumbnailURL, thumbnail.id)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Download thumbnail"
                      >
                        <Download className="h-5 w-5 text-gray-800" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-sm text-gray-300 truncate">
                    {thumbnail.userInput || 'AI generated thumbnail'}
                  </p>
                </div>
              </div>
            )
          ))
        }
      </div>
      
      {!loading && thumbnailList.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">No thumbnails yet</h3>
          <p className="text-gray-500 mt-1">Generate your first thumbnail to see it here!</p>
        </div>
      )}
    </div>
  )
}

export default ThumbnailList