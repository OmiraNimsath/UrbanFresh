import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages to enable code-splitting and smaller initial bundle
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const ProductListingPage = lazy(() => import('./pages/products/ProductListingPage'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const OrderSuccessPage = lazy(() => import('./pages/customer/OrderSuccessPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage'));
const DeliveryPersonnelPage = lazy(() => import('./pages/admin/DeliveryPersonnelPage'));
const AdminSuppliersPage = lazy(() => import('./pages/admin/AdminSuppliersPage'));
const AdminBrandsPage = lazy(() => import('./pages/admin/AdminBrandsPage'));
const AdminPurchaseOrdersPage = lazy(() => import('./pages/admin/AdminPurchaseOrdersPage'));
const AdminExpiryPage = lazy(() => import('./pages/admin/AdminExpiryPage'));
const AdminWasteReportPage = lazy(() => import('./pages/admin/AdminWasteReportPage'));
const SupplierDashboard = lazy(() => import('./pages/supplier/SupplierDashboard'));
const SupplierPurchaseOrdersPage = lazy(() => import('./pages/supplier/SupplierPurchaseOrdersPage'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const DeliveryCurrentOrdersPage = lazy(() => import('./pages/delivery/DeliveryCurrentOrdersPage'));
const DeliveryOrderHistoryPage = lazy(() => import('./pages/delivery/DeliveryOrderHistoryPage'));
const DeliveryOrderDetailsPage = lazy(() => import('./pages/delivery/DeliveryOrderDetailsPage'));
const DeliveryProfilePage = lazy(() => import('./pages/delivery/DeliveryProfilePage'));
const UnauthorizedPage = lazy(() => import('./pages/error/UnauthorizedPage'));

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
        <Suspense fallback={<div className="app-loading">Loading...</div>}>
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
            path="/admin/purchase-orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPurchaseOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expiry"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminExpiryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waste-report"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWasteReportPage />
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
            path="/supplier/purchase-orders"
            element={
              <ProtectedRoute allowedRoles={['SUPPLIER']}>
                <SupplierPurchaseOrdersPage />
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
        </Suspense>
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
