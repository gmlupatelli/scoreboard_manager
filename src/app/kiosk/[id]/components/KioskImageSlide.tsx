'use client';

import { useState } from 'react';
import Image from 'next/image';

interface KioskImageSlideProps {
  imageUrl: string;
  cacheKey?: number;
}

export default function KioskImageSlide({ imageUrl, cacheKey }: KioskImageSlideProps) {
  const [hasError, setHasError] = useState(false);

  // Create a cached URL with cache key to prevent unnecessary reloads
  const cachedImageUrl = cacheKey ? `${imageUrl}#cache=${cacheKey}` : imageUrl;

  if (hasError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p className="text-xl opacity-50">Unable to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-black">
      <Image
        src={cachedImageUrl}
        alt="Kiosk slide"
        fill
        className="object-contain"
        onError={() => setHasError(true)}
        priority
        unoptimized // Allow external images
      />
    </div>
  );
}
