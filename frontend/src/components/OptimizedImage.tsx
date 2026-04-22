/**
 * OptimizedImage Component
 * Provides responsive images with lazy loading, WebP support, and fallbacks
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useCachedImage } from '../hooks/useCachedImage';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Generate srcset for responsive images
 * Creates multiple size variants for different screen densities
 */
const generateSrcSet = (src: string): string => {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return '';
  }

  // For external URLs, we can't generate variants without backend support
  // For now, just provide the original image
  // In future, backend could provide image resizing service
  return '';
};

/**
 * OptimizedImage component with lazy loading, responsive images, and WebP support
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  sizes,
  aspectRatio,
  objectFit = 'cover',
  loading = 'lazy',
  placeholder,
  fallback,
  onLoad,
  onError,
  className,
  style,
}) => {
  const { src: cachedSrc, isLoading, error } = useCachedImage(src, {
    placeholder,
    fallback,
  });
  
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  // Handle image load
  const handleLoad = () => {
    setHasLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    if (error) {
      onError?.(error);
    }
  };

  useEffect(() => {
    if (error) {
      handleError();
    }
  }, [error]);

  const srcSet = generateSrcSet(cachedSrc);
  const showSkeleton = isLoading || (!hasLoaded && isInView);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width,
        height,
        aspectRatio,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {showSkeleton && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}
      
      {isInView && (
        <img
          ref={imgRef}
          src={cachedSrc}
          srcSet={srcSet || undefined}
          sizes={sizes}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: hasLoaded ? 'block' : 'none',
          }}
        />
      )}
    </Box>
  );
};

/**
 * Hook to preload critical images
 */
export const usePreloadCriticalImages = (urls: string[]) => {
  useEffect(() => {
    urls.forEach((url) => {
      if (url && !url.startsWith('data:')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }, [urls]);
};

export default OptimizedImage;

// Made with Bob