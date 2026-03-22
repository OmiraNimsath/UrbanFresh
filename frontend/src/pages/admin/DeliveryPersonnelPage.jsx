import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  createDeliveryPersonnel,
  getDeliveryPersonnelList,
  updateDeliveryPersonnelStatus,
} from '../../services/deliveryPersonnelService';
import CreateDeliveryPersonnelModal from '../../components/admin/CreateDeliveryPersonnelModal';

/**
 * Presentation Layer – Admin page for delivery personnel account management.
 * Allows admin to:
 *   - Create new delivery personnel accounts with secure credentials
 *   - View paginated list of all delivery personnel
 *   - Activate/deactivate accounts to control access
 * Handles validation, error display, and success notifications.
 */
export default function DeliveryPersonnelPage() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PAGE_SIZE = 20;

  // Fetch delivery personnel list on mount and page change
  useEffect(() => {
    fetchPersonnel();
  }, [currentPage]);

  /** Fetch paginated delivery personnel list from API. */
  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const { data } = await getDeliveryPersonnelList(currentPage, PAGE_SIZE);
      setPersonnel(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load delivery personnel';
      toast.error(message);
      setPersonnel([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle creation of new delivery personnel account.
   * Validates input, submits to backend, and refreshes the list.
   */
  const handleCreatePersonnel = async (formData) => {
    try {
      setIsSubmitting(true);
      await createDeliveryPersonnel(formData);
      toast.success('Delivery personnel account created successfully');
      setShowCreateModal(false);
      setCurrentPage(0); // Reset to first page to see new entry
      await fetchPersonnel();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        // Show field-level validation errors
        Object.values(errors).forEach((msg) => toast.error(msg));
      } else {
        const message = err.response?.data?.message || 'Failed to create delivery personnel account';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle delivery personnel account activation status.
   * When deactivated, they cannot log in (enforcement at login layer).
   */
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDeliveryPersonnelStatus(id, newStatus);
      const action = newStatus ? 'activated' : 'deactivated';
      toast.success(`Delivery personnel account ${action}`);
      await fetchPersonnel(); // Refresh list
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update delivery personnel status';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Delivery Personnel Management</h1>
            <p className="text-gray-600 mt-2">Create and manage delivery personnel accounts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
          >
            + Create Delivery Personnel
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateDeliveryPersonnelModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePersonnel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Table Section */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500 text-lg">Loading delivery personnel...</p>
            </div>
          ) : personnel.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500 text-lg">No delivery personnel found. Create one to get started.</p>
            </div>
          ) : (
            <>
              {/* Personnel Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Phone</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Created</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personnel.map((person) => (
                      <tr key={person.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{person.name}</td>
                        <td className="px-6 py-4 text-gray-700">{person.email}</td>
                        <td className="px-6 py-4 text-gray-700">{person.phone || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                              person.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {person.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(person.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(person.id, person.isActive)}
                            className={`px-4 py-2 rounded font-semibold text-white transition ${
                              person.isActive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {person.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold disabled:opacity-50 hover:bg-gray-400 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold disabled:opacity-50 hover:bg-gray-400 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
