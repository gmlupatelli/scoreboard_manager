'use client';

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker (local static asset)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface PdfProcessingProgress {
  current: number;
  total: number;
  status: 'loading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  fileName: string;
}

// Maximum pages to process (prevent memory issues with huge PDFs)
const MAX_PAGES = 50;

// Scale factor for rendering (2 = high quality, ~1920px wide for standard PDFs)
const RENDER_SCALE = 2;

/**
 * Convert a PDF file to an array of PNG images (one per page)
 * Processing happens entirely in the browser using pdf.js
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: (progress: PdfProcessingProgress) => void
): Promise<{ images: PdfPageImage[]; error: string | null }> {
  try {
    onProgress?.({ current: 0, total: 0, status: 'loading', message: 'Loading PDF...' });

    // Load PDF from file
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdf.numPages;

    // Check page limit
    if (totalPages > MAX_PAGES) {
      return {
        images: [],
        error: `PDF has ${totalPages} pages. Maximum allowed is ${MAX_PAGES} pages.`,
      };
    }

    onProgress?.({
      current: 0,
      total: totalPages,
      status: 'processing',
      message: `Processing ${totalPages} pages...`,
    });

    const images: PdfPageImage[] = [];
    const baseName = file.name.replace(/\.pdf$/i, '');

    // Process each page sequentially (to avoid memory issues)
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        // Get viewport at desired scale
        const viewport = page.getViewport({ scale: RENDER_SCALE });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        // Convert canvas to PNG blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) {
                resolve(b);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            },
            'image/png',
            0.92
          );
        });

        images.push({
          pageNumber: pageNum,
          blob,
          fileName: `${baseName}-page-${pageNum}.png`,
        });

        onProgress?.({
          current: pageNum,
          total: totalPages,
          status: 'processing',
          message: `Processed page ${pageNum} of ${totalPages}`,
        });

        // Clean up to free memory
        page.cleanup();
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }

    onProgress?.({
      current: totalPages,
      total: totalPages,
      status: 'complete',
      message: 'PDF processing complete',
    });

    return { images, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process PDF';
    onProgress?.({
      current: 0,
      total: 0,
      status: 'error',
      message,
    });
    return { images: [], error: message };
  }
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
