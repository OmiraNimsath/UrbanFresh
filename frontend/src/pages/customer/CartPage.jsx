import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/customer/Breadcrumbs';
import MobileBottomNav from '../../components/customer/MobileBottomNav';
import { formatAmount, formatPrice, calculateDiscountedPrice } from '../../utils/priceUtils';
import { getLoyaltyPoints } from '../../services/orderService';

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
    <div className="min-h-screen bg-[#f5f7f6] flex flex-col">
      <Navbar />

      <div className="flex-1 w-full pb-24 md:pb-8">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            { label: 'Cart' },
          ]}
        />
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#163a2f] md:text-4xl">Your Cart</h1>
            <p className="text-sm text-[#7e8d87] mt-1">Review your selections from the greenhouse.</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-[#0d4a38] hover:underline flex items-center gap-1"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Continue Shopping
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

              {cart.items.length > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#7e8d87]">{cart.itemCount} Items Selected</p>
                  <button
                    onClick={async () => {
                      try {
                        await clearCart();
                        toast.success('Cart cleared');
                      } catch {
                        toast.error('Failed to clear cart');
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    Clear all items
                  </button>
                </div>
              )}
            </div>

            {/* ── Order summary panel ── */}
            <OrderSummary cart={cart} navigate={navigate} />
          </div>
        )}
        </div>
      </div>

      <MobileBottomNav activeKey="cart" />
      <Footer />
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
    <div className={`bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-4 flex gap-4 transition-opacity ${busy ? 'opacity-50' : ''}`}>
      {/* Product image */}
      <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#eaf3ee]">
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
            <p className="font-semibold text-[#163a2f] truncate">{item.productName}</p>
            <p className="text-sm text-[#7e8d87] mt-0.5">
              {item.productDiscountPercentage ? (
                <>
                  <span className="line-through">{formatPrice(item.unitPrice, item.unit)}</span>
                  {' '}
                  <span className="text-[#0d4a38] font-semibold">
                    {formatPrice(calculateDiscountedPrice(item.unitPrice, item.productDiscountPercentage), item.unit)}
                    {' '}
                    <span className="text-xs bg-[#eaf3ee] text-[#0d4a38] px-1 rounded">({item.productDiscountPercentage}% OFF)</span>
                  </span>
                </>
              ) : (
                formatPrice(item.unitPrice, item.unit)
              )}
            </p>
            {/* Stock availability */}
            {!item.inStock ? (
              <span className="inline-block mt-1 text-xs text-red-500 font-medium">
                ⚠ Out of stock
              </span>
            ) : item.stockQuantity > 0 && (
              <span className="inline-block mt-1 text-xs text-[#7e8d87]">
                {item.stockQuantity} available
              </span>
            )}
          </div>
          {/* Line total */}
          <p className="text-sm font-bold text-[#0d4a38] whitespace-nowrap">
            {formatAmount(item.lineTotal)}
          </p>
        </div>

        {/* Quantity stepper + remove */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-[#e4ebe8] rounded-xl overflow-hidden">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-[#0d4a38] hover:bg-[#eaf3ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-[#163a2f] select-none">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={busy || item.quantity >= item.stockQuantity}
              className="w-8 h-8 flex items-center justify-center text-[#0d4a38] hover:bg-[#eaf3ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
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
 * Sticky order summary card: item count, grand total, loyalty points widget, and checkout button.
 *
 * @param {Object}   cart     - CartResponse: { items, totalAmount, itemCount }
 * @param {Function} navigate - react-router navigate function
 */
function OrderSummary({ cart, navigate }) {
  const MIN_ORDER_LKR = 200;

  const [loyaltyData, setLoyaltyData]   = useState(null);
  const [pointsInput, setPointsInput]   = useState('');
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [applyError, setApplyError]     = useState('');

  // Fetch loyalty balance once — silently ignore if not available
  useEffect(() => {
    getLoyaltyPoints()
      .then((data) => setLoyaltyData(data))
      .catch(() => {/* points display is non-critical */});
  }, []);

  const availablePoints = loyaltyData?.totalPoints ?? 0;
  const LKR_PER_POINT   = 5;
  const maxRedeemable   = Math.floor(cart.totalAmount / LKR_PER_POINT);

  const handleApplyPoints = () => {
    const pts = parseInt(pointsInput, 10);
    setApplyError('');

    if (!pts || pts <= 0) {
      setApplyError('Enter a valid number of points.');
      return;
    }
    if (pts > availablePoints) {
      setApplyError(`You only have ${availablePoints} point${availablePoints !== 1 ? 's' : ''} available.`);
      return;
    }
    if (pts > maxRedeemable) {
      setApplyError(`Maximum redeemable for this order is ${maxRedeemable} point${maxRedeemable !== 1 ? 's' : ''}.`);
      return;
    }
    setAppliedPoints(pts);
    toast.success(`${pts} loyalty point${pts !== 1 ? 's' : ''} applied!`);
  };

  const handleRemovePoints = () => {
    setAppliedPoints(0);
    setPointsInput('');
    setApplyError('');
  };

  const discount     = appliedPoints * LKR_PER_POINT;
  const payableTotal = cart.totalAmount - discount;

  // Disable checkout for out-of-stock items or below the minimum order amount.
  // Minimum threshold is checked BEFORE applying loyalty discount per business rule.
  const hasOutOfStockItem = cart.items.some((item) => !item.inStock);
  const isBelowMinimum    = cart.totalAmount < MIN_ORDER_LKR;
  const cannotCheckout    = hasOutOfStockItem || isBelowMinimum;

  return (
    <div className="lg:w-80 shrink-0">
      <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-6 lg:sticky lg:top-24 space-y-4">
        <h2 className="text-lg font-bold text-[#163a2f]">Order Summary</h2>

        <div className="space-y-2 text-sm text-[#7e8d87]">
          <div className="flex justify-between">
            <span>Items ({cart.itemCount})</span>
            <span className="text-[#163a2f] font-medium">{formatAmount(cart.totalAmount)}</span>
          </div>
          {appliedPoints > 0 && (
            <div className="flex justify-between text-[#0d4a38] font-medium">
              <span>Loyalty discount ({appliedPoints} pts)</span>
              <span>− {formatAmount(discount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#e4ebe8] pt-4 flex justify-between">
          <span className="font-bold text-[#163a2f]">Total Amount</span>
          <span className="text-2xl font-extrabold text-[#0d4a38]">{formatAmount(payableTotal)}</span>
        </div>

        {/* ── Loyalty points widget – always visible for discoverability ── */}
        <div className="border border-[#e4ebe8] rounded-xl bg-[#f5f7f6] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#163a2f]">Loyalty Points</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              availablePoints > 0
                ? 'bg-[#eaf3ee] text-[#0d4a38]'
                : 'bg-[#e4ebe8] text-[#7e8d87]'
            }`}>
              {availablePoints} pts available
            </span>
          </div>
          <p className="text-xs text-[#7e8d87]">1 point = Rs. 5 discount</p>

          {appliedPoints > 0 ? (
            <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#e4ebe8]">
              <span className="text-sm text-[#0d4a38] font-medium">
                {appliedPoints} pts → − {formatAmount(discount)}
              </span>
              <button
                onClick={handleRemovePoints}
                className="text-xs text-red-400 hover:text-red-600 underline ml-2"
              >
                Remove
              </button>
            </div>
          ) : availablePoints > 0 ? (
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={Math.min(availablePoints, maxRedeemable)}
                value={pointsInput}
                onChange={(e) => { setPointsInput(e.target.value); setApplyError(''); }}
                placeholder="Points to apply"
                className="flex-1 px-3 py-2 text-sm border border-[#e4ebe8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d4a38]"
              />
              <button
                onClick={handleApplyPoints}
                className="px-4 py-2 bg-[#0d4a38] text-white text-sm font-semibold rounded-xl hover:bg-[#083a2c] transition-colors"
              >
                Apply
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#7e8d87]">Earn points with every purchase and redeem them for discounts.</p>
          )}

          {applyError && (
            <p className="text-xs text-red-500">{applyError}</p>
          )}
        </div>

        {/* Minimum order notice */}
        {isBelowMinimum && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800 font-medium">
              Minimum order is Rs. {MIN_ORDER_LKR}.00
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Add Rs. {(MIN_ORDER_LKR - payableTotal).toFixed(2)} more to proceed.
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
          onClick={() => navigate('/checkout', { state: { pointsToRedeem: appliedPoints } })}
          className="w-full py-3 bg-[#0d4a38] text-white font-semibold rounded-xl hover:bg-[#083a2c] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Proceed to Checkout
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
        <p className="text-center text-xs text-[#7e8d87]">SECURE CHECKOUT POWERED BY URBANFRESH</p>
      </div>
    </div>
  );
}

/** Shown when the cart has no items. */
function EmptyCart() {
  return (
    <div className="bg-white rounded-2xl border border-[#e4ebe8] shadow-sm p-12 text-center">
      <p className="text-6xl mb-4">🛒</p>
      <h2 className="text-xl font-semibold text-[#163a2f] mb-2">Your cart is empty</h2>
      <p className="text-[#7e8d87] text-sm mb-6">
        Browse our fresh produce and add items to get started.
      </p>
      <Link
        to="/products"
        className="px-6 py-2.5 bg-[#0d4a38] text-white text-sm font-semibold rounded-xl hover:bg-[#083a2c] transition-colors"
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
            <div className="w-20 h-20 bg-gray-200 rounded-lg shrink-0" />
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
