import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupplierBrands, getSupplierProducts, getSupplierDashboard } from '../../services/supplierService';
import { formatPrice } from '../../utils/priceUtils';
import RequestProductModal from '../../components/supplier/RequestProductModal';

/**
 * Presentation Layer â€“ Supplier dashboard scoped by assigned brand ownership.
 */
export default function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [productData, dashboardRes] = await Promise.all([
        getSupplierProducts(),
        getSupplierDashboard(),
      ]);
      setProducts(productData);
      setDashboardData(dashboardRes);
    } catch {
      toast.error('Failed to load supplier dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">UrbanFresh Supplier Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Welcome, <span className="font-semibold">{user?.name}</span>
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-sm font-medium text-green-800 mb-1">Your Brands</h3>
                <p className="text-xl font-bold text-green-900">
                  {dashboardData?.brandNames?.length > 0
                    ? dashboardData.brandNames.join(', ')
                    : 'No Brands Assigned'}
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Total Sales</h3>
                <p className="text-xl font-bold text-blue-900">
                  ${dashboardData?.totalSales?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="text-sm font-medium text-orange-800 mb-1">Pending Restocks</h3>
                <p className="text-xl font-bold text-orange-900">
                  {dashboardData?.pendingRestocks || 0} Items
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Products You Can Manage</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow"
                >
                  + Request New Product
                </button>
              </div>

              <RequestProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                loadSupplierData(); // refresh products and dashboard numbers
              }}
            />

            {products.length === 0 ? (
              <p className="text-sm text-gray-500">No products available for your assigned brand(s).</p>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className={th}>Product</th>
                        <th className={th}>Brand</th>
                        <th className={th}>Category</th>
                        <th className={th}>Price</th>
                        <th className={th}>Stock</th>
                        <th className={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-100">
                          <td className={td}>{product.name}</td>
                          <td className={td}>{product.brandName || '—'}</td>  
                          <td className={td}>{product.category || '—'}</td>   
                          <td className={td}>{formatPrice(product.price, product.unit)}</td>
                          <td className={td}>{product.stockQuantity}</td>       
                          <td className={td}>
                            {product.approvalStatus === 'PENDING' && (
                              <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                                Pending
                              </span>
                            )}
                            {product.approvalStatus === 'APPROVED' && (
                              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                                Approved
                              </span>
                            )}
                            {product.approvalStatus === 'REJECTED' && (
                              <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3 text-gray-700';
