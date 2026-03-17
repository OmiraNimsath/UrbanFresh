import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProductById } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import { formatPrice } from '../../utils/priceUtils';

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
    // Reset state whenever the product ID in the URL changes
    setLoading(true);
    setErrorType(null);
    setProduct(null);

    getProductById(id)
      .then(setProduct)
      .catch((err) => {
        // Distinguish a missing product (404) from a network/server failure
        if (err?.response?.status === 404) {
          setErrorType('not_found');
        } else {
          setErrorType('error');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* ── Back link ── */}
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline mb-6"
        >
          ← Back to Products
        </Link>

        {/* ── Loading skeleton ── */}
        {loading && <ProductDetailSkeleton />}

        {/* ── Scenario 2: invalid / not-found product ── */}
        {!loading && errorType === 'not_found' && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
            <p className="text-gray-500 text-sm mb-6">
              The product you are looking for does not exist or has been removed.
            </p>
            <Link
              to="/products"
              className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* ── Generic error (network, server, etc.) ── */}
        {!loading && errorType === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
            Could not load product details. Please check your connection and try again.
          </div>
        )}

        {/* ── Scenario 1: product found ── */}
        {!loading && product && <ProductDetail product={product} />}
      </div>

      <footer className="bg-gray-800 text-gray-400 text-center py-6 text-sm mt-10">
        © {new Date().getFullYear()} UrbanFresh. Reducing food waste, one deal at a time.
      </footer>
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
  // Days until expiry — drives the near-expiry banner display
  const daysUntilExpiry = product.expiryDate
    ? Math.ceil((new Date(product.expiryDate) - new Date()) / 86_400_000)
    : null;

  // Mirror the 7-day near-expiry threshold used on the landing page
  const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* ── Product image ── */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full md:w-80 h-64 md:h-auto object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-full md:w-80 h-64 md:h-auto bg-green-100 flex items-center justify-center text-green-400 text-7xl flex-shrink-0">
          🥦
        </div>
      )}

      {/* ── Details panel ── */}
      <div className="p-6 flex flex-col flex-1 gap-4">
        {product.category && (
          <span className="text-xs text-green-600 font-semibold uppercase tracking-wide">
            {product.category}
          </span>
        )}

        <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>

        <p className="text-3xl font-bold text-green-700">
          {formatPrice(product.price, product.unit)}
        </p>

        {/* Near-expiry notice — surfaces discount opportunity and urgency */}
        {isNearExpiry && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
            🕐 <span className="font-semibold">Near-Expiry Offer</span> — expires on{' '}
            <span className="font-medium">{product.expiryDate}</span>
            {daysUntilExpiry === 0
              ? ' (today!)'
              : daysUntilExpiry === 1
              ? ' (tomorrow)'
              : ` (${daysUntilExpiry} days left)`}
          </div>
        )}

        {product.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        )}

        {/* Show expiry date even outside the near-expiry window for transparency */}
        {product.expiryDate && !isNearExpiry && (
          <p className="text-xs text-gray-400">Best before: {product.expiryDate}</p>
        )}

        {/* Stock status + Quantity selector + Add to Cart */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          {product.inStock ? (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-green-600 font-medium">✓ In Stock</span>

              {/* Quantity stepper */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-gray-800 select-none">
                    {quantity}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors text-lg font-bold"
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
                    toast.error(err?.response?.data?.message || 'Could not add to cart');
                  } finally {
                    setAdding(false);
                  }
                }}
                className="w-full sm:w-auto px-8 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <span className="text-sm text-red-500 font-medium">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Animated skeleton shown while the product fetch is in flight. */
function ProductDetailSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row animate-pulse">
      <div className="w-full md:w-80 h-64 bg-gray-200 flex-shrink-0" />
      <div className="p-6 flex flex-col flex-1 gap-4">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="h-9 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  );
}
