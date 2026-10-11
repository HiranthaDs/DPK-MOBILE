import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { CONFIG } from '../config';
import ProductCard from './ProductCard';

function pageNumbers(current, total) {
  const numbers = new Set([1, total]);
  for (let page = Math.max(1, current - 1); page <= Math.min(total, current + 1); page += 1) numbers.add(page);
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => index && page - sorted[index - 1] > 1 ? [`gap-${page}`, page] : [page]);
}

/** Only the current page is mounted, even when a Sheet has thousands of rows. */
export function ProductGrid({ products, resetKey = '', page: controlledPage, onPageChange, onReset }) {
  const [pagination, setPagination] = useState({ key: resetKey, page: 1 });
  const gridRef = useRef(null);
  const totalPages = Math.max(1, Math.ceil(products.length / CONFIG.pageSize));
  const requestedPage = controlledPage ?? (pagination.key === resetKey ? pagination.page : 1);
  const currentPage = Math.min(totalPages, Math.max(1, Number(requestedPage) || 1));
  const start = (currentPage - 1) * CONFIG.pageSize;

  const changePage = (nextPage) => {
    const next = Math.min(totalPages, Math.max(1, nextPage));
    if (onPageChange) onPageChange(next);
    else setPagination({ key: resetKey, page: next });
    gridRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    gridRef.current?.focus({ preventScroll: true });
  };

  if (!products.length) return <div className="empty-state catalog-empty-state"><SearchX size={30} aria-hidden="true" /><span>No products found</span><h2>Let’s find your next favourite.</h2><p>Try a different search or adjust your filters to see more of the collection.</p>{onReset && <button className="filter-view-results" onClick={onReset}>Clear filters & explore</button>}</div>;
  return (
    <>
      <div className="product-grid" ref={gridRef} tabIndex={-1} aria-label={`Products, page ${currentPage} of ${totalPages}`}>
        {products.slice(start, start + CONFIG.pageSize).map((product) => <ProductCard key={product.Product_ID} product={product} />)}
      </div>
      <div className="catalog-pagination">
        <p aria-live="polite">Showing {start + 1}–{Math.min(start + CONFIG.pageSize, products.length)} of {products.length} products</p>
        {totalPages > 1 && <nav aria-label="Product pages">
          <button className="pagination-button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={17} /><span>Previous</span></button>
          <div className="page-numbers">{pageNumbers(currentPage, totalPages).map((page) => typeof page === 'string'
            ? <span key={page} className="pagination-gap" aria-hidden="true">…</span>
            : <button key={page} className={`pagination-button ${page === currentPage ? 'is-current' : ''}`} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => changePage(page)}>{page}</button>)}</div>
          <button className="pagination-button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} aria-label="Next page"><span>Next</span><ChevronRight size={17} /></button>
        </nav>}
      </div>
    </>
  );
}

export function ProductSkeletons({ count = 8 }) {
  return <div className="product-grid" aria-busy="true" aria-label="Loading products">{Array.from({ length: count }, (_, index) => <div className="product-skeleton" key={index}><div /><span /><span /><span /></div>)}</div>;
}
