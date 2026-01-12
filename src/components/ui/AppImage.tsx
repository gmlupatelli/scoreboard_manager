'use client';

import React, { useState, ImgHTMLAttributes } from 'react';
import Image from 'next/image';

type AdditionalImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height' | 'onClick'
>;

interface AppImageProps extends AdditionalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
}

function AppImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = '/assets/images/no_image.png',
  ...props
}: AppImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // More reliable external URL detection
  const isExternal = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  const isLocal =
    imageSrc.startsWith('/') || imageSrc.startsWith('./') || imageSrc.startsWith('data:');

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const commonClassName = `${className} ${isLoading ? 'animate-pulse bg-gray-200' : ''} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`;

  // For external URLs or when in doubt, use regular img tag
  if (isExternal && !isLocal) {
    const imgStyle: React.CSSProperties = {};

    if (width) imgStyle.width = width;
    if (height) imgStyle.height = height;

    if (fill) {
      return (
        <div
          className={`relative ${className}`}
          style={{ width: width || '100%', height: height || '100%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Native img required for external URLs */}
          <img
            src={imageSrc}
            alt={alt}
            className={`${commonClassName} absolute inset-0 w-full h-full object-cover`}
            onError={handleError}
            onLoad={handleLoad}
            onClick={onClick}
            style={imgStyle}
            {...props}
          />
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element -- Native img required for external URLs
      <img
        src={imageSrc}
        alt={alt}
        className={commonClassName}
        onError={handleError}
        onLoad={handleLoad}
        onClick={onClick}
        style={imgStyle}
        {...props}
      />
    );
  }

  // For local images and data URLs, use Next.js Image component
  const imageProps = {
    src: imageSrc,
    alt,
    className: commonClassName,
    priority,
    quality,
    placeholder,
    blurDataURL,
    unoptimized: true,
    onError: handleError,
    onLoad: handleLoad,
    onClick,
    ...props,
  };

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image
          {...imageProps}
          alt={alt}
          fill
          sizes={sizes || '100vw'}
          style={{ objectFit: 'cover' }}
        />
      </div>
    );
  }

  return <Image {...imageProps} alt={alt} width={width || 400} height={height || 300} />;
}

export default AppImage;
