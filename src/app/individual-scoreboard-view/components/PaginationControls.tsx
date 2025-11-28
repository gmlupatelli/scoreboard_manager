'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  entriesPerPage: number;
  totalEntries: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  entriesPerPage,
  totalEntries,
}) => {
  const startEntry = (currentPage - 1) * entriesPerPage + 1;
  const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 px-4 py-6 bg-surface border-t border-border">
      <div className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">{startEntry}</span> to{' '}
        <span className="font-medium text-text-primary">{endEntry}</span> of{' '}
        <span className="font-medium text-text-primary">{totalEntries}</span> entries
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-smooth duration-150 ${
            currentPage === 1
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-surface text-text-primary border border-border hover:bg-muted hover-lift'
          }`}
          aria-label="Previous page"
        >
          <Icon name="ChevronLeftIcon" size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden md:flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-text-secondary">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-smooth duration-150 ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface text-text-primary border border-border hover:bg-muted hover-lift'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="md:hidden flex items-center space-x-2">
          <span className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-smooth duration-150 ${
            currentPage === totalPages
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-surface text-text-primary border border-border hover:bg-muted hover-lift'
          }`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <Icon name="ChevronRightIcon" size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;