import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSupplierBrands, getSupplierProducts } from '../../services/supplierService';
import { formatPrice } from '../../utils/priceUtils';

/**
 * Presentation Layer – Supplier dashboard scoped by assigned brand ownership.
 */
export default function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [productData, brandData] = await Promise.all([
        getSupplierProducts(),
        getSupplierBrands(),
      ]);
      setProducts(productData);
      setBrands(brandData);
    } catch {
      toast.error('Failed to load supplier catalog');
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
          <h1 className="text-2xl font-bold text-green-700">UrbanFresh Supplier</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.name}</span> (Supplier)
        </p>

        <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assigned Brands</p>
          {brands.length === 0 ? (
            <p className="text-sm text-amber-700">No brands assigned yet. Contact an administrator.</p>
          ) : (
            <p className="text-sm text-gray-700">{brands.map((brand) => brand.name).join(', ')}</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Products You Can Manage</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3 text-gray-700';
