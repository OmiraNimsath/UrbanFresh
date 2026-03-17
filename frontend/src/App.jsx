import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/landing/LandingPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import ProductListingPage from './pages/products/ProductListingPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProfilePage from './pages/customer/ProfilePage';
import PaymentResultPage from './pages/customer/PaymentResultPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import UnauthorizedPage from './pages/error/UnauthorizedPage';

/**
 * App – Root component.
 * Wraps the app in AuthProvider for global auth state and
 * CartProvider for customer cart state.
 * Declares all application routes (public & protected).
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <BrowserRouter>
        {/* Global toast notifications */}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Protected customer routes ── */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/result"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <PaymentResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier"
            element={
              <ProtectedRoute allowedRoles={['SUPPLIER']}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
