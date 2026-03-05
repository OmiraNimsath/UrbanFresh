import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/**
 * Presentation Layer – Customer dashboard placeholder.
 * Full implementation in later sprints (product browsing, orders, etc.).
 */
export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">UrbanFresh</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.name}</span>!
        </p>
        <p className="text-gray-400 text-sm mt-2 mb-6">
          Customer portal coming in upcoming sprints.
        </p>

        {/* Quick-access cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 border border-green-200 rounded-xl hover:bg-green-50 transition-colors group"
          >
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm font-semibold text-green-700 group-hover:text-green-800">My Profile</p>
              <p className="text-xs text-gray-400">Update your name, phone &amp; address</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
