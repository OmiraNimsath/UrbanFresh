import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/**
 * Presentation Layer – Admin dashboard placeholder.
 * Full implementation in later sprints (product CRUD, inventory, reports).
 */
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">UrbanFresh Admin</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Welcome, <span className="font-semibold">{user?.name}</span> (Admin)
        </p>

        {/* Quick-action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/products"
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="text-3xl">🛒</div>
            <div>
              <p className="font-semibold text-gray-800">Manage Products</p>
              <p className="text-xs text-gray-400 mt-0.5">Add, edit, delete products</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
