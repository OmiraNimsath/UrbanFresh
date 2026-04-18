import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProductById } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/customer/Breadcrumbs';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import { formatPrice, calculateDiscountedPrice } from '../../utils/priceUtils';
import { getApiErrorMessage } from '../../utils/errorMessageUtils';

/**
 * Page Layer – Public product detail page.
 * Fetches a single product by its URL param ID and displays full product info,
 * including a near-expiry notice when applicable, and an "Add to Cart" button
 * when the product is in stock.
 * Renders explicit loading, not-found, and generic error states.
 */
export default function ProductDetailPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  // 'not_found' | 'error' | null — explicit variants keep UI messaging clear
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Reset state whenever the product ID in the URL changes
    const resetTimer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setErrorType(null);
      setProduct(null);
    }, 0);

    getProductById(id)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Distinguish a missing product (404) from a network/server failure
        if (err?.response?.status === 404) {
          setErrorType('not_found');
        } else {
          setErrorType('error');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(resetTimer);
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f5f7f6] flex flex-col">
      <Navbar />

      <div className="flex-1 w-full pb-24 md:pb-8">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
          <Breadcrumbs
            items={[
              { label: 'Products', to: '/products' },
              { label: product?.name || 'Product Details' },
            ]}
          />

        {/* ── Loading skeleton ── */}
          {loading && <ProductDetailSkeleton />}

        {/* ── Scenario 2: invalid / not-found product ── */}
          {!loading && errorType === 'not_found' && (
            <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-[#163a2f] mb-2">Product Not Found</h2>
            <p className="text-[#7e8d87] text-sm mb-6">
              The product you are looking for does not exist or has been removed.
            </p>
            <Link
              to="/products"
              className="px-5 py-2.5 bg-[#0d4a38] text-white text-sm font-semibold rounded-xl hover:bg-[#083a2c] transition-colors"
            >
              Browse All Products
            </Link>
            </div>
          )}

        {/* ── Generic error (network, server, etc.) ── */}
          {!loading && errorType === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
            Could not load product details. Please check your connection and try again.
            </div>
          )}

        {/* ── Scenario 1: product found ── */}
          {!loading && product && <ProductDetail product={product} />}
        </div>
      </div>

      <MobileBottomNav activeKey="shop" />
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components (private to this file)
───────────────────────────────────────────── */

/**
 * Renders the full product detail card: image, name, category, price,
 * description, near-expiry notice, stock status, and Add to Cart button.
 *
 * @param {Object} product - ProductResponse received from the API
 */
function ProductDetail({ product }) {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding]     = useState(false);
  const [quantity, setQuantity] = useState(1);
  // Use the earliest available batch expiry — falls back to the entity-level field
  // for legacy products with no batch records.
  const displayExpiry = product.earliestExpiryDate ?? product.expiryDate;

  // Days until expiry — drives the near-expiry banner display
  const daysUntilExpiry = displayExpiry
    ? Math.ceil((new Date(displayExpiry) - new Date()) / 86_400_000)
    : null;

  // Mirror the 7-day near-expiry threshold used on the landing page
  const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* ── Product image ── */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full md:w-96 h-72 md:h-auto object-cover shrink-0"
        />
      ) : (
        <div className="w-full md:w-96 h-72 md:h-auto bg-[#eaf3ee] flex items-center justify-center text-[#0d4a38] text-7xl shrink-0">
          🥦
        </div>
      )}

      {/* ── Details panel ── */}
      <div className="p-8 flex flex-col flex-1 gap-4">
        {product.category && (
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-white bg-[#0d4a38] px-3 py-1 rounded-full w-fit">
            {product.category}
          </span>
        )}

        <h1 className="text-3xl font-bold text-[#163a2f]">{product.name}</h1>

        {product.discountPercentage ? (
          <div className="space-y-1">
            <div className="text-base text-[#7e8d87] line-through">
              {formatPrice(product.price, product.unit)}
            </div>
            <p className="text-4xl font-bold text-[#0d4a38]">
              {formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage), product.unit)}
            </p>
            <div className="inline-block bg-[#eaf3ee] text-[#0d4a38] font-bold px-3 py-1 rounded-lg text-sm">
              {product.discountPercentage}% OFF
            </div>
          </div>
        ) : (
          <p className="text-4xl font-bold text-[#0d4a38]">
            {formatPrice(product.price, product.unit)}
          </p>
        )}

        {/* Near-expiry notice — surfaces discount opportunity and urgency */}
        {isNearExpiry && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⏰</span>
            <span>
              <span className="font-semibold">Freshness Alert</span>: This batch expires in{' '}
              {daysUntilExpiry === 0 ? 'today' : daysUntilExpiry === 1 ? '1 day' : `${daysUntilExpiry} days`}.
              {product.discountPercentage ? ' Enjoy ' + product.discountPercentage + '% off at checkout.' : ''}
            </span>
          </div>
        )}

        {product.description && (
          <p className="text-[#4a5c55] text-sm leading-relaxed">{product.description}</p>
        )}

        {/* Show expiry date even outside the near-expiry window for transparency */}
        {displayExpiry && !isNearExpiry && (
          <p className="text-xs text-[#7e8d87]">Best before: {displayExpiry}</p>
        )}

        {/* Stock status + Quantity selector + Add to Cart */}
        <div className="mt-auto pt-5 border-t border-[#e4ebe8]">
          {product.inStock ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0d4a38]"></span>
                <span className="text-sm font-medium text-[#0d4a38]">In Stock</span>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#163a2f] uppercase tracking-wide">Quantity</span>
                <div className="flex items-center border border-[#e4ebe8] rounded-xl overflow-hidden">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-[#0d4a38] hover:bg-[#eaf3ee] active:bg-[#d3e8dc] transition-colors text-xl font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-[#163a2f] select-none">
                    {quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="w-10 h-10 flex items-center justify-center text-[#0d4a38] hover:bg-[#eaf3ee] active:bg-[#d3e8dc] transition-colors text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                disabled={adding}
                onClick={async () => {
                  if (!isAuthenticated || user?.role !== 'CUSTOMER') {
                    navigate('/login');
                    return;
                  }
                  setAdding(true);
                  try {
                    await addToCart(product.id, quantity);
                    toast.success(`${product.name} × ${quantity} added to cart`);
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Could not add to cart. Please try again.'));
                  } finally {
                    setAdding(false);
                  }
                }}
                className="w-full py-3 bg-[#0d4a38] hover:bg-[#083a2c] text-white text-sm font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <span className="inline-block px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-600">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Animated skeleton shown while the product fetch is in flight. */
function ProductDetailSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm overflow-hidden flex flex-col md:flex-row animate-pulse">
      <div className="w-full md:w-96 h-72 bg-[#e4ebe8] shrink-0" />
      <div className="p-8 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-[#e4ebe8] rounded-full w-20" />
        <div className="h-7 bg-[#e4ebe8] rounded-lg w-2/3" />
        <div className="h-9 bg-[#e4ebe8] rounded-lg w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-[#e4ebe8] rounded w-full" />
          <div className="h-3 bg-[#e4ebe8] rounded w-5/6" />
          <div className="h-3 bg-[#e4ebe8] rounded w-4/6" />
        </div>
        <div className="mt-auto pt-5 border-t border-[#e4ebe8]">
          <div className="h-11 bg-[#e4ebe8] rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
