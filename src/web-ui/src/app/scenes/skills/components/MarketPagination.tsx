import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MarketPagination.scss';

interface MarketPaginationProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  loadingMore: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  prevLabel: string;
  nextLabel: string;
}

export const MarketPagination: React.FC<MarketPaginationProps> = ({
  currentPage,
  totalPages,
  hasMore,
  loadingMore,
  onPrevPage,
  onNextPage,
  prevLabel,
  nextLabel,
}) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = !hasMore && currentPage >= totalPages - 1;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      // Calculate range around current page
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 2, 3);
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 3) {
        start = Math.max(1, totalPages - 4);
      }

      // Add ellipsis before middle section if needed
      if (start > 1) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after middle section if needed
      if (end < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="market-pagination">
      <button
        type="button"
        className="market-pagination__nav-btn"
        onClick={onPrevPage}
        disabled={isFirstPage || loadingMore}
        aria-label={prevLabel}
        title={prevLabel}
      >
        <ChevronLeft size={16} />
      </button>

      <div className="market-pagination__pages">
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="market-pagination__ellipsis">...</span>
            ) : (
              <button
                type="button"
                className={[
                  'market-pagination__page-btn',
                  currentPage === page && 'is-active',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  if (typeof page === 'number' && page !== currentPage) {
                    const diff = page - currentPage;
                    if (diff > 0) {
                      for (let i = 0; i < diff; i++) {
                        onNextPage();
                      }
                    } else {
                      for (let i = 0; i < Math.abs(diff); i++) {
                        onPrevPage();
                      }
                    }
                  }
                }}
                disabled={loadingMore}
                aria-label={`第 ${(page as number) + 1} 页`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {(page as number) + 1}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        type="button"
        className="market-pagination__nav-btn"
        onClick={onNextPage}
        disabled={isLastPage || loadingMore}
        aria-label={nextLabel}
        title={nextLabel}
      >
        <ChevronRight size={16} />
      </button>

      <div className="market-pagination__info">
        <span className="market-pagination__total">
          共 {totalPages} 页
        </span>
        {hasMore && (
          <span className="market-pagination__more">· 还有更多</span>
        )}
      </div>
    </div>
  );
};
