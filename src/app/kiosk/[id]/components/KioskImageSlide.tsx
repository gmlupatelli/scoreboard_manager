'use client';

import { useState } from 'react';
import Image from 'next/image';

interface KioskImageSlideProps {
  imageUrl: string;
  nextImageUrl?: string; // Pre-load next image
}

export default function KioskImageSlide({ imageUrl, nextImageUrl }: KioskImageSlideProps) {
  const [hasError, setHasError] = useState(false);

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
    <>
      {/* Main image */}
      <div className="h-full w-full relative bg-black">
        <Image
          src={imageUrl}
          alt="Kiosk slide"
          fill
          className="object-contain"
          onError={() => setHasError(true)}
          priority
          unoptimized // Allow external images
        />
      </div>

      {/* Hidden next image preload */}
      {nextImageUrl && (
        <Image
          src={nextImageUrl}
          alt="Preload"
          width={0}
          height={0}
          className="hidden"
          unoptimized
          onError={() => {}} // Silent error for preload
        />
      )}
    </>
  );
}
