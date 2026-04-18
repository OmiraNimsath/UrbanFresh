import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiShoppingBag, FiClock, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import {
  assignDeliveryPersonnel,
  getActiveDeliveryPersonnel,
  getAllOrders,
  getOrderReview,
  updateOrderStatus,
} from '../../services/orderService';
import OrderStatusCorrectionModal from '../../components/admin/OrderStatusCorrectionModal';
import OrderReviewModal from '../../components/admin/OrderReviewModal';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import DeliveryStatusBadge from '../../components/admin/delivery/DeliveryStatusBadge';
import DeliveryStatusConfirmModal from '../../components/admin/delivery/DeliveryStatusConfirmModal';

const PAGE_SIZE = 20;
const FILTERED_PAGE_SIZE = 8;

/**
 * Presentation Layer – Admin order management page.
 */
export default function AdminOrdersPage() {
  const [pageData, setPageData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [filteredPage, setFilteredPage] = useState(0);
  const [pendingCorrection, setPendingCorrection] = useState(null);
  const [orderReviewOpen, setOrderReviewOpen] = useState(false);
  const [loadingOrderReview, setLoadingOrderReview] = useState(false);
  const [selectedOrderReview, setSelectedOrderReview] = useState(null);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState({});
  const [pendingDeliveryAssignment, setPendingDeliveryAssignment] = useState(null);

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
    void fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  useEffect(() => {
    getActiveDeliveryPersonnel()
      .then((list) => setDeliveryPersonnel(list))
      .catch(() => toast.error('Could not load delivery personnel list.'));
  }, []);

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

  const handleCorrectionConfirm = (reason) => {
    if (!pendingCorrection) {
      return;
    }

    const queued = pendingCorrection;
    setPendingCorrection(null);
    void submitOrderStatusUpdate(queued.orderId, queued.toStatus, reason);
  };

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
      setSelectedDeliveryPerson((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
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

  const filteredOrders = useMemo(
    () =>
      (pageData?.content || []).filter((order) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesQuery =
          query.length === 0 ||
          String(order.orderId).includes(query) ||
          (order.customerName || '').toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [pageData, searchTerm, statusFilter]
  );

  // Reset filtered page when search or filter changes
  useEffect(() => { setFilteredPage(0); }, [searchTerm, statusFilter]);

  const totalFilteredPages = Math.max(1, Math.ceil(filteredOrders.length / FILTERED_PAGE_SIZE));
  const pagedFilteredOrders = filteredOrders.slice(
    filteredPage * FILTERED_PAGE_SIZE,
    (filteredPage + 1) * FILTERED_PAGE_SIZE
  );

  const stats = useMemo(() => {
    const source = pageData?.content || [];
    const total = source.length;
    const processing = source.filter((order) => order.orderStatus === 'PROCESSING').length;
    const delivered = source.filter((order) => order.orderStatus === 'DELIVERED').length;
    const revenue = source.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      total,
      processing,
      delivered,
      revenue,
    };
  }, [pageData]);

  return (
    <AdminDeliveryLayout
      title="Order Management"
      breadcrumbCurrent="Manage Orders"
      breadcrumbItems={[
        { label: 'Admin' },
        { label: 'Manage Orders' },
      ]}
      description="Monitor order lifecycle, assign delivery personnel, and review order details."
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
        loading={pendingDeliveryAssignment ? updatingOrderId === pendingDeliveryAssignment.orderId : false}
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

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Total Orders Today" value={String(stats.total)} note="+12% from yesterday" icon={FiShoppingBag} />
        <MetricCard label="Pending Processing" value={String(stats.processing)} note="Requires action" icon={FiClock} />
        <MetricCard label="Revenue (Daily)" value={`Rs. ${formatLkr(stats.revenue)}`} note="Healthy flow" icon={FiDollarSign} />
        <MetricCard label="Delivered" value={String(stats.delivered)} note="98% success rate" icon={FiCheckCircle} />
      </section>

      <section className="rounded-2xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a85]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search orders..."
              className="h-11 w-full rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] pl-10 pr-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
              aria-label="Search orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm font-semibold text-[#425d55] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
            aria-label="Filter orders by status"
          >
            <option value="all">All Statuses</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f0f5f3] px-4 text-sm font-semibold text-[#425d55] transition hover:bg-[#e5eeea]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
            Filters
          </button>


        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#f2cccc] bg-[#fdecee] p-3 text-sm text-[#b03a3a]">{error}</div>
        )}

        {loading && <OrdersTableSkeleton />}

        {!loading && pageData && (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-[#e4ebe8] md:block">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#f5f8f7] text-left text-[11px] uppercase tracking-widest text-[#7a8a85]">
                    <th className={th}>Order Number</th>
                    <th className={th}>Customer Name</th>
                    <th className={th}>Order Total</th>
                    <th className={th}>Payment</th>
                    <th className={th}>Status</th>
                    <th className={th}>Placed On</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#6f817b]">
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
                    pagedFilteredOrders.map((order) => (
                      <tr key={order.orderId} className="border-t border-[#edf2f0] align-top">
                        <td className={td}>#UF-ORD-{order.orderId}</td>
                        <td className={td}>
                          <span className="font-semibold text-[#1f3b32]">{order.customerName ?? 'Unknown customer'}</span>
                        </td>
                        <td className={td}>{formatCurrency(order.totalAmount ?? 0)}</td>
                        <td className={td}>
                          <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus ?? 'PENDING'}</span>
                        </td>
                        <td className={td}>
                          <DeliveryStatusBadge status={order.orderStatus} />
                        </td>
                        <td className={td}>{formatDate(order.orderDate)}</td>
                        <td className={td}>
                          <div className="flex min-w-60 flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                className="h-8 rounded-lg border border-[#d5dfdb] bg-white px-2.5 text-xs font-medium text-[#526b64] disabled:cursor-not-allowed disabled:bg-[#eff4f2]"
                                value={order.orderStatus}
                                disabled={
                                  updatingOrderId === order.orderId ||
                                  getAllowedNextStatuses(order.orderStatus).length === 0
                                }
                                onChange={(event) => handleStatusChange(order.orderId, event.target.value)}
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
                                className="inline-flex h-8 items-center justify-center rounded-lg bg-[#0d4a38] px-3 text-xs font-semibold text-white transition hover:bg-[#083a2c]"
                              >
                                Review
                              </button>
                            </div>

                            {(order.orderStatus === 'READY' || order.orderStatus === 'OUT_FOR_DELIVERY') && (
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  className="h-8 min-w-40 flex-1 rounded-lg border border-[#d5dfdb] bg-white px-2.5 text-xs font-medium text-[#526b64]"
                                  value={selectedDeliveryPerson[order.orderId] ?? order.deliveryPersonId ?? ''}
                                  onChange={(event) =>
                                    setSelectedDeliveryPerson((prev) => ({
                                      ...prev,
                                      [order.orderId]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Select delivery person</option>
                                  {deliveryPersonnel.map((person) => (
                                    <option key={person.id} value={person.id}>
                                      {person.name}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  disabled={updatingOrderId === order.orderId}
                                  onClick={() => requestAssignDelivery(order)}
                                  className="inline-flex h-8 items-center justify-center rounded-lg bg-[#2f7f5f] px-3 text-xs font-semibold text-white transition hover:bg-[#25664d] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {order.deliveryPersonId ? 'Reassign' : 'Assign'}
                                </button>
                              </div>
                            )}

                            {order.deliveryPersonName && (
                              <p className="text-xs text-[#6f817b]">Assigned to: {order.deliveryPersonName}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4">
                  <OrdersEmptyState
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    onReset={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  />
                </div>
              ) : (
                pagedFilteredOrders.map((order) => (
                  <article key={order.orderId} className="rounded-2xl border border-[#e4ebe8] bg-[#f8fbf9] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f817b]">Order</p>
                        <p className="text-sm font-semibold text-[#1f3b32]">#UF-ORD-{order.orderId}</p>
                      </div>
                      <DeliveryStatusBadge status={order.orderStatus} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#1f3b32]">{order.customerName ?? 'Unknown customer'}</p>
                    <p className="mt-1 text-sm text-[#526b64]">{formatCurrency(order.totalAmount ?? 0)}</p>
                    <p className="mt-1 text-xs text-[#6f817b]">Placed on {formatDate(order.orderDate)}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openOrderReview(order.orderId)}
                        className="rounded-lg bg-[#0d4a38] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Review
                      </button>

                      <select
                        className="h-8 min-w-36 rounded-lg border border-[#d5dfdb] bg-white px-2 text-xs font-medium text-[#526b64]"
                        value={order.orderStatus}
                        disabled={
                          updatingOrderId === order.orderId ||
                          getAllowedNextStatuses(order.orderStatus).length === 0
                        }
                        onChange={(event) => handleStatusChange(order.orderId, event.target.value)}
                      >
                        {getStatusOptions(order.orderStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(order.orderStatus === 'READY' || order.orderStatus === 'OUT_FOR_DELIVERY') && (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="h-8 flex-1 rounded-lg border border-[#d5dfdb] bg-white px-2 text-xs font-medium text-[#526b64]"
                          value={selectedDeliveryPerson[order.orderId] ?? order.deliveryPersonId ?? ''}
                          onChange={(event) =>
                            setSelectedDeliveryPerson((prev) => ({
                              ...prev,
                              [order.orderId]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select delivery person</option>
                          {deliveryPersonnel.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={updatingOrderId === order.orderId}
                          onClick={() => requestAssignDelivery(order)}
                          className="rounded-lg bg-[#2f7f5f] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {order.deliveryPersonId ? 'Reassign' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>

            {(totalFilteredPages > 1 || pageData.totalPages > 1) && (
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#6f817b] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {filteredOrders.length === 0 ? 0 : filteredPage * FILTERED_PAGE_SIZE + 1}–{Math.min((filteredPage + 1) * FILTERED_PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} orders
                  {pageData.totalPages > 1 && ` (page ${pageData.number + 1}/${pageData.totalPages} loaded)`}
                </span>
                <div className="flex gap-2">
                  {pageData.totalPages > 1 && (
                    <>
                      <button
                        onClick={() => { setCurrentPage((v) => v - 1); setFilteredPage(0); }}
                        disabled={pageData.first}
                        className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                      >
                        Load Prev
                      </button>
                      <button
                        onClick={() => { setCurrentPage((v) => v + 1); setFilteredPage(0); }}
                        disabled={pageData.last}
                        className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                      >
                        Load Next
                      </button>
                    </>
                  )}
                  {totalFilteredPages > 1 && (
                    <>
                      <button
                        onClick={() => setFilteredPage((p) => p - 1)}
                        disabled={filteredPage === 0}
                        className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setFilteredPage((p) => p + 1)}
                        disabled={filteredPage >= totalFilteredPages - 1}
                        className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                      >
                        Next
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </AdminDeliveryLayout>
  );
}

const ADMIN_FLOW_OPTIONS = {
  CONFIRMED: ['CONFIRMED', 'PROCESSING', 'CANCELLED'],
  PROCESSING: ['PROCESSING', 'READY', 'CANCELLED'],
  READY: ['READY', 'PROCESSING'],
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

const STATUS_PROGRESS_INDEX = ORDER_STATUSES.reduce((accumulator, status, index) => {
  accumulator[status] = index;
  return accumulator;
}, {});

const STATUS_FILTER_OPTIONS = ORDER_STATUSES;
const th = 'px-4 py-3';
const td = 'px-4 py-3 text-sm text-[#425d55]';

function OrdersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4ebe8]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#f5f8f7] text-left text-[11px] uppercase tracking-widest text-[#7a8a85]">
              <th className={th}>Order Number</th>
              <th className={th}>Customer Name</th>
              <th className={th}>Order Total</th>
              <th className={th}>Payment</th>
              <th className={th}>Status</th>
              <th className={th}>Placed On</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-[#edf2f0]">
                {[...Array(7)].map((__, colIndex) => (
                  <td key={colIndex} className={td}>
                    <div className="h-4 w-full animate-pulse rounded bg-[#e4ebe8]" />
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
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-4 text-center">
      <h3 className="text-base font-semibold text-[#324c44]">No orders found</h3>
      <p className="text-sm text-[#6f817b]">
        {hasFilters
          ? 'No orders match your current search or status filter.'
          : 'No orders are available yet.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 text-xs font-semibold text-[#526b64] transition hover:bg-[#f2f7f5]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function MetricCard({ label, value, note, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm">
      {Icon && (
        <div className="mb-3 inline-flex rounded-xl bg-[#eaf5ef] p-2.5 text-[#0d4a38]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-[#6f817b]">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-[#133b31]">{value}</p>
      <p className="mt-1 text-sm text-[#58957a]">{note}</p>
    </article>
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

function formatCurrency(amount) {
  const numericValue = Number(amount || 0);
  return `Rs. ${numericValue.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLkr(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  if (status === 'PAID') return 'inline-flex rounded-full bg-[#c8f0da] px-2.5 py-1 text-xs font-semibold text-[#1f6a4d]';
  if (status === 'FAILED') return 'inline-flex rounded-full bg-[#f9d4d8] px-2.5 py-1 text-xs font-semibold text-[#ad2c3c]';
  return 'inline-flex rounded-full bg-[#e8efec] px-2.5 py-1 text-xs font-semibold text-[#526b64]';
}
