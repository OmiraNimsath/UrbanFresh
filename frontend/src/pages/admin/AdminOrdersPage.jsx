import { useCallback, useEffect, useState } from 'react';
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
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import DeliveryStatusBadge from '../../components/admin/delivery/DeliveryStatusBadge';
import DeliveryStatusConfirmModal from '../../components/admin/delivery/DeliveryStatusConfirmModal';

const PAGE_SIZE = 20;

/**
 * Presentation Layer – Admin order management page.
 * Displays a paginated order table and allows order status updates.
 */
export default function AdminOrdersPage() {
  const [pageData, setPageData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [pendingCorrection, setPendingCorrection] = useState(null);
  const [orderReviewOpen, setOrderReviewOpen] = useState(false);
  const [loadingOrderReview, setLoadingOrderReview] = useState(false);
  const [selectedOrderReview, setSelectedOrderReview] = useState(null);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState({});
  const [pendingDeliveryAssignment, setPendingDeliveryAssignment] = useState(null);

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
  const submitAssignDelivery = async (orderId, deliveryPersonId) => {
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

  const requestAssignDelivery = (order) => {
    const deliveryPersonId = selectedDeliveryPerson[order.orderId] || order.deliveryPersonId;
    if (!deliveryPersonId) {
      toast.error('Please select a delivery person first.');
      return;
    }

    const isReassignment = Boolean(order.deliveryPersonId) && Number(order.deliveryPersonId) !== Number(deliveryPersonId);
    if (isReassignment) {
      setPendingDeliveryAssignment({
        orderId: order.orderId,
        nextDeliveryPersonId: Number(deliveryPersonId),
        currentName: order.deliveryPersonName,
      });
      return;
    }

    void submitAssignDelivery(order.orderId, Number(deliveryPersonId));
  };

  const filteredOrders = (pageData?.content || []).filter((order) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      String(order.orderId).includes(query) ||
      (order.customerName || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalOrders = pageData?.totalElements ?? 0;

  return (
    <AdminDeliveryLayout
      title="Orders"
      breadcrumbCurrent="Orders"
      description="Manage orders, update statuses, and assign delivery personnel when needed."
    >
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

      <DeliveryStatusConfirmModal
        isOpen={Boolean(pendingDeliveryAssignment)}
        title="Confirm Reassignment"
        message={`This order is already assigned to ${pendingDeliveryAssignment?.currentName || 'a delivery person'}. Do you want to reassign it?`}
        confirmLabel="Reassign"
        intent="primary"
        loading={
          pendingDeliveryAssignment
            ? updatingOrderId === pendingDeliveryAssignment.orderId
            : false
        }
        onCancel={() => setPendingDeliveryAssignment(null)}
        onConfirm={() => {
          if (!pendingDeliveryAssignment) return;
          const queued = pendingDeliveryAssignment;
          setPendingDeliveryAssignment(null);
          void submitAssignDelivery(queued.orderId, queued.nextDeliveryPersonId);
        }}
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

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-green-600">Admin Panel</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Order Management</h2>
            <p className="mt-1 text-sm text-slate-600">Track order progress and manage delivery assignments.</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order ID or customer"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              aria-label="Search orders"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              aria-label="Filter orders by status"
            >
              <option value="all">All statuses</option>
              {STATUS_FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <OrdersTableSkeleton />
        )}

        {!loading && pageData && (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className={th}>Order ID</th>
                      <th className={th}>Customer Name</th>
                      <th className={th}>Order Total</th>
                      <th className={th}>Payment</th>
                      <th className={th}>Order Status</th>
                      <th className={th}>Placed On</th>
                      <th className={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500">
                          <OrdersEmptyState
                            searchTerm={searchTerm}
                            statusFilter={statusFilter}
                            onReset={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderId} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className={td}>#{order.orderId}</td>
                          <td className={td}>{order.customerName ?? 'Unknown customer'}</td>
                          <td className={td}>{formatAmount(order.totalAmount ?? 0)}</td>
                          <td className={td}>
                            <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus ?? 'PENDING'}</span>
                          </td>
                          <td className={td}>
                            <DeliveryStatusBadge status={order.orderStatus} />
                          </td>
                          <td className={td}>{formatDate(order.orderDate)}</td>
                          <td className={td}>
                            <div className="flex min-w-[16rem] flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  className="h-8 rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                                  className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Review
                                </button>
                              </div>

                              {(order.orderStatus === 'READY' || order.orderStatus === 'OUT_FOR_DELIVERY') && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    className="h-8 min-w-40 flex-1 rounded-lg border border-blue-300 px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    value={selectedDeliveryPerson[order.orderId] ?? order.deliveryPersonId ?? ''}
                                    onChange={(e) =>
                                      setSelectedDeliveryPerson((prev) => ({
                                        ...prev,
                                        [order.orderId]: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">Select delivery person</option>
                                    {deliveryPersonnel.map((dp) => (
                                      <option key={dp.id} value={dp.id}>
                                        {dp.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.orderId}
                                    onClick={() => requestAssignDelivery(order)}
                                    className="inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {order.deliveryPersonId ? 'Reassign' : 'Assign'}
                                  </button>
                                </div>
                              )}

                              {order.deliveryPersonName && (
                                <p className="text-xs text-slate-500">Assigned to: {order.deliveryPersonName}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pageData.totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Page {pageData.number + 1} of {pageData.totalPages} - {totalOrders} orders total
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={pageData.first}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={pageData.last}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminDeliveryLayout>
  );
}

const ADMIN_FLOW_OPTIONS = {
  CONFIRMED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  PROCESSING: ['PROCESSING', 'READY', 'CANCELLED'],
  READY: ['READY', 'PROCESSING'],
  CANCELLED: ['CANCELLED', 'PROCESSING'],
};

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'CANCELLED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
];

const STATUS_PROGRESS_INDEX = ORDER_STATUSES.reduce((acc, status, index) => {
  acc[status] = index;
  return acc;
}, {});

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3 text-slate-700';
const STATUS_FILTER_OPTIONS = ORDER_STATUSES;

function OrdersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className={th}>Order ID</th>
              <th className={th}>Customer Name</th>
              <th className={th}>Order Total</th>
              <th className={th}>Payment</th>
              <th className={th}>Order Status</th>
              <th className={th}>Placed On</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, index) => (
              <tr key={index} className="border-t border-slate-200">
                {[...Array(7)].map((__, columnIndex) => (
                  <td key={columnIndex} className={td}>
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersEmptyState({ searchTerm, statusFilter, onReset }) {
  const hasFilters = Boolean(searchTerm.trim()) || statusFilter !== 'all';

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4">
      <h3 className="text-base font-semibold text-slate-700">No orders found</h3>
      <p className="text-sm text-slate-500">
        {hasFilters
          ? 'No orders match your current search or status filter.'
          : 'No orders are available yet.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
