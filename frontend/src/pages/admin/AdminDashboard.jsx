import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import adminDashboardService from '../../services/adminDashboardService';
import { useAuth } from '../../context/AuthContext';

/**
 * Admin Dashboard Component
 * Layer: UI (React component)
 * Displays admin KPI metrics, alerts, and operational overview
 * Shows: total orders, revenue, product count, supplier count, and alerts for low stock/near expiry
 */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  /**
   * Fetch dashboard metrics from backend
   * Handles loading, error, and success states
   */
  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminDashboardService.getDashboardMetrics();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError('Failed to load dashboard metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state: skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md p-6 animate-pulse"
              >
                <div className="h-8 bg-gray-200 rounded mb-4 w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchDashboardMetrics}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state: render dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with User Info and Logout */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-700">UrbanFresh Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome, <span className="font-semibold">{user?.name}</span> (Admin)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/profile"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
          {dashboardData?.summary && (
            <p className="text-sm text-gray-500">
              Last updated: {dashboardData.summary.lastUpdated}
            </p>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Total Orders</p>
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {dashboardData?.totalOrders || 0}
            </p>
            <p className="text-xs text-gray-400 mt-2">All-time customer orders</p>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Total Revenue</p>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              Rs. {(dashboardData?.totalRevenue || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-gray-400 mt-2">From confirmed orders</p>
          </div>

          {/* Total Products Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Total Products</p>
              <span className="text-3xl">🛒</span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {dashboardData?.totalProductsCount || 0}
            </p>
            <p className="text-xs text-gray-400 mt-2">Active catalog items</p>
          </div>

          {/* Active Suppliers Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 font-medium">Active Suppliers</p>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-green-700">
              {dashboardData?.activeSuppliersCount || 0}
            </p>
            <p className="text-xs text-gray-400 mt-2">Registered suppliers</p>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Alerts & Warnings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Low Stock Alert */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⚠️</span>
                <p className="font-semibold text-gray-800">Low Stock Items</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 mb-2">
                {dashboardData?.lowStockItemsCount || 0}
              </p>
              <p className="text-sm text-gray-600">
                Products below reorder threshold
              </p>
            </div>

            {/* Near Expiry Alert */}
            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🕐</span>
                <p className="font-semibold text-gray-800">Near Expiry Items</p>
              </div>
              <p className="text-2xl font-bold text-orange-700 mb-2">
                {dashboardData?.nearExpiryItemsCount || 0}
              </p>
              <p className="text-sm text-gray-600">
                Items expiring within 7 days
              </p>
            </div>

            {/* Waste Percentage Alert */}
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">♻️</span>
                <p className="font-semibold text-gray-800">Waste Percentage</p>
              </div>
              <p className="text-2xl font-bold text-red-700 mb-2">
                {(dashboardData?.wastePercentage || 0).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600">
                Goods wasted this period
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/admin/products"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🛒</span>
              <div>
                <p className="font-semibold text-gray-800">Manage Products</p>
                <p className="text-xs text-gray-400">Add, edit, delete products</p>
              </div>
            </Link>

            <Link
              to="/admin/inventory"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">📦</span>
              <div>
                <p className="font-semibold text-gray-800">Inventory</p>
                <p className="text-xs text-gray-400">Manage stock & reorder</p>
              </div>
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🧾</span>
              <div>
                <p className="font-semibold text-gray-800">Manage Orders</p>
                <p className="text-xs text-gray-400">Review order status</p>
              </div>
            </Link>

            <Link
              to="/admin/delivery-personnel"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🚚</span>
              <div>
                <p className="font-semibold text-gray-800">Delivery Personnel</p>
                <p className="text-xs text-gray-400">Create & manage accounts</p>
              </div>
            </Link>

            <Link
              to="/admin/suppliers"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🏷️</span>
              <div>
                <p className="font-semibold text-gray-800">Manage Suppliers</p>
                <p className="text-xs text-gray-400">Create suppliers and assign brands</p>
              </div>
            </Link>

            <Link
              to="/admin/brands"
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl">🏭</span>
              <div>
                <p className="font-semibold text-gray-800">Manage Brands</p>
                <p className="text-xs text-gray-400">Create, update, and deactivate brands</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
