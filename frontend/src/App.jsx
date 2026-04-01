import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import DeliveryPersonnelPage from './pages/admin/DeliveryPersonnelPage';
import AdminSuppliersPage from './pages/admin/AdminSuppliersPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryCurrentOrdersPage from './pages/delivery/DeliveryCurrentOrdersPage';
import DeliveryOrderHistoryPage from './pages/delivery/DeliveryOrderHistoryPage';
import DeliveryOrderDetailsPage from './pages/delivery/DeliveryOrderDetailsPage';
import DeliveryProfilePage from './pages/delivery/DeliveryProfilePage';
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
            path="/order-success"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/result"
            element={<LegacyPaymentResultRedirect />}
          />
          <Route
            path="/payment-result"
            element={<LegacyPaymentResultRedirect />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* ── Protected admin routes ── */}
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
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/delivery-personnel"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DeliveryPersonnelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminBrandsPage />
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
          <Route
            path="/delivery/orders/current"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY']}>
                <DeliveryCurrentOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/orders/history"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY']}>
                <DeliveryOrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/orders/:orderId"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY']}>
                <DeliveryOrderDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/profile"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY']}>
                <DeliveryProfilePage />
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

function LegacyPaymentResultRedirect() {
  const location = useLocation();
  const target = `/order-success${location.search || ''}`;

  return <Navigate to={target} replace state={location.state} />;
}

export default App;
