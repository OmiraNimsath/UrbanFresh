import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../../components/customer/Breadcrumbs';
import { getProducts, getCategories } from '../../services/productService';
import Navbar from '../../components/Navbar';
import SearchBar from '../../components/SearchBar';
import Footer from '../../components/Footer';
import { formatPrice, calculateDiscountedPrice } from '../../utils/priceUtils';

/**
 * Page Layer – Public product listing page.
 * Allows visitors and authenticated users to browse, search, filter by category,
 * and sort the full product catalogue.
 *
 * State architecture (fixes keystroke-per-request bug):
 *  - inputValue     : local state bound to the <SearchBar> input. Changes on every
 *                     keystroke but is NEVER a dependency of the product fetch.
 *  - committedSearch: derived directly from the URL (?search=). Only changes when
 *                     the user explicitly submits a search or selects a suggestion.
 *  - All other filter params (category, sortBy, page) are also derived from the URL.
 *
 * The URL is the single source of truth for all committed filter state, which means
 * browser back/forward navigation correctly restores the previous search results.
 */
export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Derive committed filter state directly from the URL ─────────────────────
  // These are NOT useState — they are plain derived values. Changing the URL
  // (via setSearchParams) updates them, which in turn re-runs the fetch effect.
  const committedSearch = searchParams.get('search')   || '';
  const category        = searchParams.get('category') || '';
  const sortBy          = searchParams.get('sortBy')   || '';
  const page            = Number(searchParams.get('page') || 0);

  // ── Local input state — only for what's typed in the search box ─────────────
  // Initialised from the URL on mount so a bookmarked/shared URL pre-fills the input.
  // This state MUST NOT be a dependency of the product fetch — that's the core fix.
  const [inputValue, setInputValue] = useState(committedSearch);

  // Keep inputValue in sync when the URL changes from browser back/forward.
  // We track the previous committed value with a ref to avoid re-running on
  // every render caused by other URL param changes (category, sort, page).
  const prevCommittedRef = useRef(committedSearch);
  useEffect(() => {
    if (committedSearch !== prevCommittedRef.current) {
      const syncTimer = window.setTimeout(() => {
        setInputValue(committedSearch);
      }, 0);
      prevCommittedRef.current = committedSearch;

      return () => {
        window.clearTimeout(syncTimer);
      };
    }

    return undefined;
  }, [committedSearch]);

  const [result, setResult]         = useState(null);   // ProductPageResponse
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // ── Fetch category list once on mount ──────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([])); // non-critical; dropdown stays empty
  }, []);

  // ── Fetch products whenever committed filter state (URL params) change ──────
  // inputValue is intentionally absent from this dependency array.
  // Typing updates inputValue only; the fetch only fires when the URL changes.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return null;

        setLoading(true);
        setError(null);

        return getProducts({ search: committedSearch, category, sortBy, page, size: 8 });
      })
      .then((data) => {
        if (!cancelled && data) {
          setResult(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load products. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [committedSearch, category, sortBy, page]);

  // ── URL mutation helpers ────────────────────────────────────────────────────

  /**
   * Writes a new committed search term to the URL, which triggers the fetch effect.
   * Resets the page to 0 so the first results page is always shown on a new search.
   */
  const commitSearch = (value) => {
    const trimmed = value.trim();
    setInputValue(trimmed); // keep the input box in sync
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (trimmed) next.set('search', trimmed); else next.delete('search');
      next.delete('page'); // always back to page 0 on a new search
      return next;
    });
  };

  const handleCategoryChange = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set('category', val); else next.delete('category');
      next.delete('page');
      return next;
    });
  };

  const handleSortChange = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set('sortBy', val); else next.delete('sortBy');
      next.delete('page');
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage > 0) next.set('page', String(newPage)); else next.delete('page');
      return next;
    }, { replace: true }); // replace so paging doesn't pollute browser history
  };

  return (
    <div className="min-h-screen bg-[#f3f4f3] flex flex-col text-[#14261f]">
      {/* ── Navigation (auth-aware via shared Navbar) ── */}
      <Navbar />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Products', to: '/products' },
            { label: 'Shop All' },
          ]}
        />
        <h1 className="text-5xl font-medium leading-[1.02] text-[#183127]">The Fresh Market</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#6b7c74]">
          Hand-picked seasonal fruits and vegetables from local farms. Find what you need quickly and filter by value.
        </p>

        {/* ── Search + Filter + Sort bar ── */}
        <div className="mt-6 mb-6 flex flex-col gap-3 rounded-2xl border border-[#dce3de] bg-white p-4 sm:flex-row sm:items-center">
          {/* Search — uses SearchBar which keeps inputValue separate from the fetch */}
          <SearchBar
            value={inputValue}
            onChange={setInputValue}
            onCommit={commitSearch}
          />

          {/* Category filter */}
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="h-10 rounded-lg border border-[#dce3de] bg-white px-3 text-sm text-[#1b2d25] focus:outline-none focus:ring-2 focus:ring-[#9ac8b1]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="h-10 rounded-lg border border-[#dce3de] bg-white px-3 text-sm text-[#1b2d25] focus:outline-none focus:ring-2 focus:ring-[#9ac8b1]"
          >
            <option value="">Sort: Name A–Z</option>
            <option value="price_asc">Sort: Price Low–High</option>
            <option value="price_desc">Sort: Price High–Low</option>
          </select>
        </div>

        {/* ── Results summary ── */}
        {result && !loading && (
          <p className="mb-4 text-sm text-[#6f8078]">
            {result.totalElements === 0
              ? 'No products found.'
              : `Showing ${result.products.length} of ${result.totalElements} products`}
          </p>
        )}

        {/* ── Product grid ── */}
        {loading && <ProductGridSkeleton />}

        {error && (
          <div className="rounded-lg border border-[#f1caca] bg-[#fff2f2] px-4 py-3 text-sm text-[#b63a3a]">
            {error}
          </div>
        )}

        {!loading && !error && result?.products.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#d8dfda] bg-white px-4 py-16 text-center text-sm text-[#7a8781]">
            No products match your search. Try different keywords or clear the filters.
          </div>
        )}

        {!loading && !error && result?.products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {result && result.totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {/* Prev */}
            <button
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border border-[#ccd7d1] bg-white px-4 py-2 text-sm text-[#2a4d3f] transition-colors hover:bg-[#f3f7f5] disabled:opacity-40"
            >
              ← Prev
            </button>

            {/* Numbered buttons — show up to 5 around the current page */}
            {Array.from({ length: result.totalPages }, (_, i) => i)
              .filter((i) => {
                if (result.totalPages <= 7) return true;
                if (i === 0 || i === result.totalPages - 1) return true;
                return Math.abs(i - page) <= 2;
              })
              .reduce((acc, i, idx, arr) => {
                if (idx > 0 && i - arr[idx - 1] > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-[#8fa89f]">&hellip;</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => handlePageChange(item)}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      item === page
                        ? 'border-[#0d4a38] bg-[#0d4a38] text-white'
                        : 'border-[#ccd7d1] bg-white text-[#2a4d3f] hover:bg-[#f3f7f5]'
                    }`}
                  >
                    {item + 1}
                  </button>
                ),
              )}

            {/* Next */}
            <button
              onClick={() => handlePageChange(Math.min(result.totalPages - 1, page + 1))}
              disabled={page >= result.totalPages - 1}
              className="rounded-lg border border-[#ccd7d1] bg-white px-4 py-2 text-sm text-[#2a4d3f] transition-colors hover:bg-[#f3f7f5] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components (private to this file)
───────────────────────────────────────────── */

/**
 * Renders a single product card showing name, category, price,
 * stock status, and a near-expiry badge when expiryDate is set.
 *
 * @param {Object} product - ProductResponse from the API
 */
function ProductCard({ product }) {
  // Prefer the batch-aware flag from the API; fall back to the legacy single expiryDate
  const isNearExpiry = product.hasNearExpiryBatches
    ?? (product.expiryDate
      ? Math.ceil((new Date(product.expiryDate) - new Date()) / 86400000) <= 7
      : false);

  // Show the earliest batch expiry date when available, otherwise the legacy field
  const expiryLabel = product.earliestExpiryDate ?? product.expiryDate;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-[#dde3df] bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(14,54,37,0.12)]"
    >
      {product.imageUrl ? (
        <>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-36 w-full object-cover transition-opacity group-hover:opacity-95 sm:h-44"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          <div
            style={{ display: 'none' }}
            className="h-36 w-full items-center justify-center bg-[#e8f1eb] text-4xl text-[#6f8f80] sm:h-44"
          >
            🥦
          </div>
        </>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-[#e8f1eb] text-4xl text-[#6f8f80] sm:h-44">
          🥦
        </div>
      )}

      <div className="flex min-h-37 flex-col p-3 sm:p-4">
        {product.category && (
          <span className="mb-1 inline-flex w-fit rounded-full bg-[#e9f2ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2d664d]">
            {product.category}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold text-[#1d3128] sm:text-[15px]">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-1 text-xs text-[#7a8b83]">{product.description}</p>
        )}

        <div className="mt-auto space-y-1 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              {product.discountPercentage ? (
                <>
                  <div className="text-xs text-[#ad3d3d] line-through">
                    {formatPrice(product.price, product.unit)}
                  </div>
                  <div className="text-base font-bold text-[#123f2f]">
                    {formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage), product.unit)}
                  </div>
                  <div className="mt-1 inline-flex w-fit rounded bg-[#f6dede] px-1.5 py-0.5 text-[10px] font-semibold text-[#af3434]">
                    {product.discountPercentage}% OFF
                  </div>
                </>
              ) : (
                <span className="text-base font-bold text-[#123f2f]">{formatPrice(product.price, product.unit)}</span>
              )}
            </div>
            {!product.inStock && (
              <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold text-[#8a8a8a]">Out of stock</span>
            )}
          </div>
          {/* Near-expiry badge — highlights discount opportunity */}
          {isNearExpiry && (
            <div className="rounded bg-[#f5d8d8] px-2 py-1 text-center text-[11px] font-semibold text-[#b02e2e]">
              🕐 Expires {expiryLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Skeleton grid shown while products are loading. */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#dde3df] bg-white animate-pulse">
          <div className="h-36 w-full bg-[#e7ebe8] sm:h-44" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-[#e7ebe8]" />
            <div className="h-4 w-2/3 rounded bg-[#e7ebe8]" />
            <div className="h-3 w-full rounded bg-[#e7ebe8]" />
            <div className="mt-2 h-4 w-1/4 rounded bg-[#e7ebe8]" />
          </div>
        </div>
      ))}
    </div>
  );
}
