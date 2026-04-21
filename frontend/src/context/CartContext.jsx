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

/** Mock cart for Figma design preview — bypasses backend auth. */
const MOCK_CART = {
  items: [],
  totalAmount: 0,
  itemCount: 0,
};

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [cart, setCart] = useState(MOCK_CART);
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
      // Mock mode: skip backend fetch, keep mock cart
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
    setCart((prev) => {
      const existing = prev.items.find((i) => i.productId === productId);
      let items;
      if (existing) {
        items = prev.items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity, subtotal: i.price * (i.quantity + quantity) } : i);
      } else {
        const newItem = { id: Date.now(), productId, productName: 'Product', price: 1.99, unit: 'item', quantity, subtotal: 1.99 };
        items = [...prev.items, newItem];
      }
      const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
      return { items, totalAmount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
    });
  };

  const updateCartItem = async (cartItemId, quantity) => {
    setCart((prev) => {
      const items = prev.items.map((i) => i.id === cartItemId ? { ...i, quantity, subtotal: i.price * quantity } : i);
      const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
      return { items, totalAmount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
    });
  };

  const removeCartItem = async (cartItemId) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.id !== cartItemId);
      const totalAmount = items.reduce((s, i) => s + i.subtotal, 0);
      return { items, totalAmount, itemCount: items.reduce((s, i) => s + i.quantity, 0) };
    });
  };

  const clearCart = async () => {
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
