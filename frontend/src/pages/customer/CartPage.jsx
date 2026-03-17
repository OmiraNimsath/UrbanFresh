import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import { formatAmount, formatPrice } from '../../utils/priceUtils';

/**
 * Page Layer – Customer cart page.
 * Displays all items in the cart with controls to update quantity and remove items.
 * Shows a running total and a "Proceed to Checkout" CTA.
 * Reads and mutates cart state exclusively through CartContext so there is no
 * duplicate API state in this component.
 */
export default function CartPage() {
  const { cart, loading, error, updateCartItem, removeCartItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (loading) return <CartLoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
          <Link
            to="/products"
            className="text-sm text-green-600 hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Backend error banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Item list ── */}
            <div className="flex-1 space-y-4">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  onUpdate={updateCartItem}
                  onRemove={removeCartItem}
                />
              ))}

              {/* Clear-all link */}
              <div className="text-right">
                <button
                  onClick={async () => {
                    try {
                      await clearCart();
                      toast.success('Cart cleared');
                    } catch {
                      toast.error('Failed to clear cart');
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-600 underline"
                >
                  Clear all items
                </button>
              </div>
            </div>

            {/* ── Order summary panel ── */}
            <OrderSummary cart={cart} navigate={navigate} />
          </div>
        )}
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
 * Single cart item row with image, product info, quantity stepper, and remove button.
 * Maintains a local "busy" flag so the stepper and remove button are disabled during
 * the in-flight request, preventing double-clicks from producing duplicate mutations.
 *
 * @param {Object}   item      - CartItemResponse from the API
 * @param {Function} onUpdate  - (cartItemId, quantity) => Promise
 * @param {Function} onRemove  - (cartItemId) => Promise
 */
function CartItemRow({ item, onUpdate, onRemove }) {
  const [busy, setBusy] = useState(false);

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1 || busy) return;
    setBusy(true);
    try {
      await onUpdate(item.cartItemId, newQty);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update quantity');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onRemove(item.cartItemId);
      toast.success(`${item.productName} removed`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove item');
      setBusy(false); // only reset on error — on success the row unmounts
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 flex gap-4 transition-opacity ${busy ? 'opacity-50' : ''}`}>
      {/* Product image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-green-50">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🥦</div>
        )}
      </div>

      {/* Product details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-800 truncate">{item.productName}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatPrice(item.unitPrice, item.unit)}
            </p>
            {/* Flag out-of-stock items so the customer knows before checkout */}
            {!item.inStock && (
              <span className="inline-block mt-1 text-xs text-red-500 font-medium">
                ⚠ Out of stock
              </span>
            )}
          </div>
          {/* Line total */}
          <p className="text-sm font-bold text-green-700 whitespace-nowrap">
            {formatAmount(item.lineTotal)}
          </p>
        </div>

        {/* Quantity stepper + remove */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-gray-800 select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={busy}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={busy}
            className="text-xs text-red-400 hover:text-red-600 underline disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sticky order summary card: item count, grand total, checkout button.
 *
 * @param {Object}   cart     - CartResponse: { items, totalAmount, itemCount }
 * @param {Function} navigate - react-router navigate function
 */
function OrderSummary({ cart, navigate }) {
  const MIN_ORDER_LKR = 200;

  // Disable checkout for out-of-stock items or below the minimum order amount
  const hasOutOfStockItem   = cart.items.some((item) => !item.inStock);
  const isBelowMinimum      = cart.totalAmount < MIN_ORDER_LKR;
  const cannotCheckout      = hasOutOfStockItem || isBelowMinimum;

  return (
    <div className="lg:w-80 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-24 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Items ({cart.itemCount})</span>
            <span>{formatAmount(cart.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span className="text-green-600 font-medium">Calculated at checkout</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-800">
          <span>Subtotal</span>
          <span className="text-green-700">{formatAmount(cart.totalAmount)}</span>
        </div>

        {/* Minimum order notice */}
        {isBelowMinimum && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800 font-medium">
              Minimum order is Rs. {MIN_ORDER_LKR}.00
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Add Rs. {(MIN_ORDER_LKR - cart.totalAmount).toFixed(2)} more to proceed.
            </p>
          </div>
        )}

        {/* Out-of-stock notice */}
        {hasOutOfStockItem && !isBelowMinimum && (
          <p className="text-xs text-red-500">
            Remove out-of-stock items before checking out.
          </p>
        )}

        <button
          disabled={cannotCheckout}
          onClick={() => navigate('/checkout')}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

/** Shown when the cart has no items. */
function EmptyCart() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <p className="text-6xl mb-4">🛒</p>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 text-sm mb-6">
        Browse our fresh produce and add items to get started.
      </p>
      <Link
        to="/products"
        className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
      >
        Shop Now
      </Link>
    </div>
  );
}

/** Full-screen loading state shown on first cart load. */
function CartLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 bg-gray-200 rounded w-2/5" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-28 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
