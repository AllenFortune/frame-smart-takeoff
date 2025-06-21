
import { useRef, useEffect, useState } from 'react';

interface ImageLoaderProps {
  imageUrl: string;
  onImageLoad: (img: HTMLImageElement) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onError: (error: string) => void;
}

export const useImageLoader = ({ 
  imageUrl, 
  onImageLoad, 
  onLoadingChange, 
  onError 
}: ImageLoaderProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoadTimeout, setImageLoadTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      console.log('ImageLoader: No image URL provided');
      onLoadingChange(false);
      return;
    }

    console.log('ImageLoader: Starting image load process for:', imageUrl.substring(0, 100) + '...');
    
    // Clear any existing timeout
    if (imageLoadTimeout) {
      clearTimeout(imageLoadTimeout);
    }

    // Reset states
    onLoadingChange(true);
    onError('');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Set up timeout for image loading (15 seconds - reduced from 30)
    const timeout = setTimeout(() => {
      console.error('ImageLoader: Image load timeout after 15 seconds');
      onError('Image load timeout - please check your connection and try again');
      onLoadingChange(false);
    }, 15000);
    
    setImageLoadTimeout(timeout);
    
    img.onload = () => {
      console.log('ImageLoader: Image loaded successfully!');
      console.log('ImageLoader: Image dimensions:', img.width, 'x', img.height);
      console.log('ImageLoader: Image naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);
      
      clearTimeout(timeout);
      setImageLoadTimeout(null);
      
      // Check if this is a valid image (not a 1x1 placeholder)
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        console.warn('ImageLoader: Loaded image appears to be a placeholder');
        onError('Image appears to be a placeholder - the actual plan image may not be available');
        onLoadingChange(false);
        return;
      }
      
      imageRef.current = img;
      onError('');
      onLoadingChange(false);
      onImageLoad(img);
    };
    
    img.onerror = (error) => {
      console.error('ImageLoader: Image load error:', error);
      console.error('ImageLoader: Failed URL:', imageUrl);
      
      clearTimeout(timeout);
      setImageLoadTimeout(null);
      
      onError('Failed to load plan image - the URL may be expired or inaccessible');
      onLoadingChange(false);
    };
    
    img.onabort = () => {
      console.warn('ImageLoader: Image load aborted');
      clearTimeout(timeout);
      setImageLoadTimeout(null);
      onLoadingChange(false);
    };
    
    console.log('ImageLoader: Setting image src to trigger load...');
    img.src = imageUrl;

    // Cleanup function
    return () => {
      if (imageLoadTimeout) {
        clearTimeout(imageLoadTimeout);
      }
    };
  }, [imageUrl, onImageLoad, onLoadingChange, onError]);

  return { imageRef };
};
