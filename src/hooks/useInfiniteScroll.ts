'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node || !hasMore || isLoading) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(node);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [node, hasMore, isLoading, onLoadMore, threshold, rootMargin]);

  const loadMoreRef = useCallback((newNode: HTMLDivElement | null) => {
    setNode(newNode);
  }, []);

  return { loadMoreRef };
}
