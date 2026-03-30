import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getAllOrders,
  getOrderReview,
  updateOrderStatus,
  assignDeliveryPersonnel,
  getActiveDeliveryPersonnel,
} from '../../services/orderService';
import { formatAmount } from '../../utils/priceUtils';
import OrderStatusCorrectionModal from '../../components/admin/OrderStatusCorrectionModal';
import OrderReviewModal from '../../components/admin/OrderReviewModal';

const PAGE_SIZE = 20;

/**
 * Presentation Layer – Admin order management page.
 * Displays a paginated order table and allows order status updates.
 */
export default function AdminOrdersPage() {
  const [pageData, setPageData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [pendingCorrection, setPendingCorrection] = useState(null);
  const [orderReviewOpen, setOrderReviewOpen] = useState(false);
  const [loadingOrderReview, setLoadingOrderReview] = useState(false);
  const [selectedOrderReview, setSelectedOrderReview] = useState(null);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState({});

  /**
   * Loads a page of admin orders from the backend.
   *
   * @param {number} page zero-based page index
   */
  const fetchOrders = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders(page, PAGE_SIZE);
      setPageData(data);
    } catch {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  // Load active delivery personnel once for the assignment dropdowns
  useEffect(() => {
    getActiveDeliveryPersonnel()
      .then((list) => setDeliveryPersonnel(list))
      .catch(() => toast.error('Could not load delivery personnel list.'));
  }, []);

  /**
   * Updates status for a single order row and patches local UI state on success.
   *
   * @param {number} orderId target order ID
   * @param {string} nextStatus target status selected by admin
   */
  const submitOrderStatusUpdate = async (orderId, nextStatus, changeReason = null) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus, changeReason);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((row) => (row.orderId === orderId ? updated : row)),
        };
      });
      toast.success(`Order #${orderId} updated to ${updated.orderStatus}`);
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to update order status.';
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /**
   * Handles admin status selection from the table row.
   * Opens correction modal only for backward transitions.
   *
   * @param {number} orderId target order ID
   * @param {string} nextStatus selected target status
   */
  const handleStatusChange = (orderId, nextStatus) => {
    const order = pageData?.content?.find((row) => row.orderId === orderId);
    if (!order || order.orderStatus === nextStatus) {
      return;
    }

    if (isBackwardStatusChange(order.orderStatus, nextStatus)) {
      setPendingCorrection({
        orderId,
        fromStatus: order.orderStatus,
        toStatus: nextStatus,
      });
      return;
    }

    void submitOrderStatusUpdate(orderId, nextStatus);
  };

  /**
   * Submits correction reason for a queued backward transition.
   *
   * @param {string} reason trimmed correction reason
   */
  const handleCorrectionConfirm = (reason) => {
    if (!pendingCorrection) {
      return;
    }

    const queuedChange = pendingCorrection;
    setPendingCorrection(null);
    void submitOrderStatusUpdate(queuedChange.orderId, queuedChange.toStatus, reason);
  };

  /**
   * Loads and opens the detailed order review modal.
   *
   * @param {number} orderId target order ID
   */
  const openOrderReview = async (orderId) => {
    setOrderReviewOpen(true);
    setLoadingOrderReview(true);
    setSelectedOrderReview(null);
    try {
      const details = await getOrderReview(orderId);
      setSelectedOrderReview(details);
    } catch {
      toast.error('Failed to load order review details. Please try again.');
    } finally {
      setLoadingOrderReview(false);
    }
  };

  /**
   * Assigns the selected delivery person to a READY order.
   * The backend transitions the order to OUT_FOR_DELIVERY automatically.
   *
   * @param {number} orderId target order ID
   */
  const handleAssignDelivery = async (orderId) => {
    const deliveryPersonId = selectedDeliveryPerson[orderId];
    if (!deliveryPersonId) {
      toast.error('Please select a delivery person first.');
      return;
    }
    setUpdatingOrderId(orderId);
    try {
      const updated = await assignDeliveryPersonnel(orderId, Number(deliveryPersonId));
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: prev.content.map((row) => (row.orderId === orderId ? updated : row)),
        };
      });
      setSelectedDeliveryPerson((prev) => { const next = { ...prev }; delete next[orderId]; return next; });
      toast.success(`Order #${orderId} assigned to ${updated.deliveryPersonName ?? 'delivery person'}.`);
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to assign delivery person.';
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <OrderStatusCorrectionModal
        key={
          pendingCorrection
            ? `${pendingCorrection.orderId}-${pendingCorrection.fromStatus}-${pendingCorrection.toStatus}`
            : 'no-pending-correction'
        }
        isOpen={Boolean(pendingCorrection)}
        fromStatus={pendingCorrection?.fromStatus ?? ''}
        toStatus={pendingCorrection?.toStatus ?? ''}
        loading={updatingOrderId === pendingCorrection?.orderId}
        onCancel={() => setPendingCorrection(null)}
        onConfirm={handleCorrectionConfirm}
      />

      <OrderReviewModal
        isOpen={orderReviewOpen}
        loading={loadingOrderReview}
        order={selectedOrderReview}
        onClose={() => {
          setOrderReviewOpen(false);
          setSelectedOrderReview(null);
        }}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && pageData && (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={th}>Order ID</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Total</th>
                  <th className={th}>Payment Status</th>
                  <th className={th}>Order Status</th>
                  <th className={th}>Order Date</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(pageData.content ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  (pageData.content ?? []).map((order) => (
                    <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className={td}>#{order.orderId}</td>
                      <td className={td}>{order.customerName ?? '—'}</td>
                      <td className={td}>{formatAmount(order.totalAmount ?? 0)}</td>
                      <td className={td}>
                        <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus ?? 'PENDING'}</span>
                      </td>
                      <td className={td}>
                        <span className={orderBadgeClass(order.orderStatus)}>{order.orderStatus ?? 'PENDING'}</span>
                      </td>
                      <td className={td}>{formatDate(order.orderDate)}</td>
                      <td className={td}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-gray-300 rounded-lg px-2 py-1 text-xs disabled:appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                              value={order.orderStatus}
                              disabled={
                                updatingOrderId === order.orderId ||
                                getAllowedNextStatuses(order.orderStatus).length === 0
                              }
                              onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                            >
                              {getStatusOptions(order.orderStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => openOrderReview(order.orderId)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              Review
                            </button>
                          </div>

                          {order.orderStatus === 'READY' && (
                            <div className="flex items-center gap-2">
                              <select
                                className="border border-blue-300 rounded-lg px-2 py-1 text-xs flex-1 min-w-[130px]"
                                value={selectedDeliveryPerson[order.orderId] ?? ''}
                                onChange={(e) =>
                                  setSelectedDeliveryPerson((prev) => ({
                                    ...prev,
                                    [order.orderId]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Assign delivery...</option>
                                {deliveryPersonnel.map((dp) => (
                                  <option key={dp.id} value={dp.id}>
                                    {dp.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={updatingOrderId === order.orderId || !selectedDeliveryPerson[order.orderId]}
                                onClick={() => handleAssignDelivery(order.orderId)}
                                className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                Assign
                              </button>
                            </div>
                          )}

                          {order.orderStatus === 'OUT_FOR_DELIVERY' && order.deliveryPersonName && (
                            <p className="text-xs text-gray-500">
                              🚚 {order.deliveryPersonName}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pageData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {pageData.number + 1} of {pageData.totalPages} — {pageData.totalElements} orders total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={pageData.first}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={pageData.last}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const ADMIN_FLOW_OPTIONS = {
  CONFIRMED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  PROCESSING: ['PROCESSING', 'READY', 'CANCELLED'],
  READY: ['READY', 'PROCESSING'],
  CANCELLED: ['CANCELLED', 'PROCESSING'],
};

const STATUS_PROGRESS_INDEX = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  RETURNED: 6,
  CANCELLED: 7,
};

const th = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide';
const td = 'px-4 py-3 text-gray-700';

function formatDate(dateValue) {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function orderBadgeClass(status) {
  if (status === 'READY') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700';
  if (status === 'PROCESSING') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700';
  if (status === 'CANCELLED') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700';
  if (status === 'OUT_FOR_DELIVERY') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700';
  if (status === 'DELIVERED') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
  return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700';
}

function getAllowedNextStatuses(currentStatus) {
  return ADMIN_FLOW_OPTIONS[currentStatus] ?? [];
}

function getStatusOptions(currentStatus) {
  const allowed = getAllowedNextStatuses(currentStatus);
  if (allowed.length > 0) {
    return allowed;
  }

  return [currentStatus];
}

function isBackwardStatusChange(currentStatus, nextStatus) {
  const currentIndex = STATUS_PROGRESS_INDEX[currentStatus];
  const nextIndex = STATUS_PROGRESS_INDEX[nextStatus];

  if (currentIndex === undefined || nextIndex === undefined) {
    return false;
  }

  return nextIndex < currentIndex;
}

function paymentBadgeClass(status) {
  if (status === 'PAID') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700';
  if (status === 'FAILED') return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700';
  return 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700';
}
