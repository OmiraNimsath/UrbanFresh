/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCart as apiClearCart,
} from '../services/cartService';

/**
 * Context Layer – Manages cart state for the authenticated customer.
 * Fetches the cart from the backend on login and clears it on logout.
 * Exposes thin action wrappers that update local state after each successful API call,
 * so components never need to manually refresh the cart.
 */
const CartContext = createContext(null);

/** Empty cart shape — used before the first load and after logout. */
const EMPTY_CART = { items: [], totalAmount: 0, itemCount: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load the customer's cart from the backend.
   * Called automatically when the user logs in.
   */
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      // Non-fatal — the cart page will surface its own error state.
      setError(err?.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync cart with auth state: fetch on login, reset on logout.
  useEffect(() => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      fetchCart();
    } else {
      setCart(EMPTY_CART);
      setError(null);
    }
  }, [isAuthenticated, user?.role, fetchCart]);

  /**
   * Add a product to the cart.
   * Throws on error so the calling component can show a toast.
   * @param {number} productId
   * @param {number} [quantity=1]
   */
  const addToCart = async (productId, quantity = 1) => {
    const updated = await apiAddToCart(productId, quantity);
    setCart(updated);
  };

  /**
   * Update the quantity of an existing cart item.
   * @param {number} cartItemId
   * @param {number} quantity
   */
  const updateCartItem = async (cartItemId, quantity) => {
    const updated = await apiUpdateCartItem(cartItemId, quantity);
    setCart(updated);
  };

  /**
   * Remove a single item from the cart.
   * @param {number} cartItemId
   */
  const removeCartItem = async (cartItemId) => {
    const updated = await apiRemoveCartItem(cartItemId);
    setCart(updated);
  };

  /**
   * Clear all items from the cart (e.g. after order placement).
   */
  const clearCart = async () => {
    await apiClearCart();
    setCart(EMPTY_CART);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook to access cart state from any component.
 * Must be used inside CartProvider.
 * @returns {{ cart, loading, error, addToCart, updateCartItem, removeCartItem, clearCart, refreshCart }}
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
