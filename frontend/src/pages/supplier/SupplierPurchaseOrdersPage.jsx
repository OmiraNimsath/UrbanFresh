import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiDownload, FiSearch, FiSend, FiX } from 'react-icons/fi';
import useSupplierPurchaseOrders from '../../hooks/useSupplierPurchaseOrders';
import UpdatePurchaseOrderStatusModal from '../../components/supplier/UpdatePurchaseOrderStatusModal';
import toast from 'react-hot-toast';
import SupplierLayout from '../../components/supplier/SupplierLayout';

/**
 * Presentation Layer - Displays all purchase orders mapped to a supplier's brands.
 */
export default function SupplierPurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders, updateStatus, sendNotice } = useSupplierPurchaseOrders();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [noticeOrderId, setNoticeOrderId] = useState(null);
  const [noticeText, setNoticeText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => { setPage(0); }, [statusFilter, search]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectOrderId) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    const result = await updateStatus(rejectOrderId, {
      status: 'CANCELLED',
      rejectionReason,
    });

    if (result.success) {
      toast.success('Order Rejected!');
      fetchOrders();
    } else {
      toast.error(result.error || 'Failed to reject order');
    }

    setRejectOrderId(null);
    setRejectionReason('');
  };

  const submitNotice = async () => {
    if (!noticeOrderId) return;
    if (!noticeText.trim()) {
      toast.error('Please provide the notice text.');
      return;
    }

    const result = await sendNotice(noticeOrderId, noticeText);

    if (result.success) {
      toast.success('Notice sent to admin!');
      fetchOrders();
    } else {
      toast.error(result.error || 'Failed to send notice');
    }

    setNoticeOrderId(null);
    setNoticeText('');
  };

  const filteredOrders = useMemo(() => {
    let result = statusFilter === 'ALL' ? [...orders] : orders.filter((o) => o.status === statusFilter);
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          `PO-${o.id}`.toLowerCase().includes(q) ||
          (o.brandName || '').toLowerCase().includes(q) ||
          (o.items || []).some((item) => item.productName?.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (sortField === 'id') return sortDir === 'asc' ? a.id - b.id : b.id - a.id;
      const av = sortField === 'brand' ? (a.brandName || '') : (a.status || '');
      const bv = sortField === 'brand' ? (b.brandName || '') : (b.status || '');
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [orders, statusFilter, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const activeOrders = orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status)).length;
  const pendingActions = orders.filter((order) => order.status === 'PENDING').length;
  const fulfillmentRate = orders.length
    ? `${Math.round((orders.filter((order) => order.status === 'COMPLETED').length / orders.length) * 100)}%`
    : '0%';

  const handleExportCsv = () => {
    const source = filteredOrders;
    if (source.length === 0) {
      toast.error('No orders available to export.');
      return;
    }

    const headers = ['OrderId', 'Brand', 'Status', 'EstimatedDeliveryTimeline', 'ItemCount'];
    const rows = source.map((order) => [
      `PO-${order.id}`,
      order.brandName || 'Unknown',
      order.status,
      order.estimatedDeliveryTimeline || '',
      (order.items || []).length,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'supplier-purchase-orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV export completed.');
  };

  return (
    <SupplierLayout
      activeKey="purchase-orders"
      userName={user?.name}
      onLogout={handleLogout}
      pageTitle="Purchase Orders"
      pageSubtitle="Review and fulfill purchase requests from retail partners"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/supplier' },
        { label: 'Purchase Orders' },
      ]}
      pageAction={
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0d4a38] px-3 text-xs font-semibold text-white transition hover:bg-[#083a2c] md:text-sm"
        >
          <FiDownload className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-[#e4ebe8] bg-white p-6 text-sm text-[#6f817b]">
          Loading purchase orders...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-[#f6d9dc] bg-[#fdecee] p-6 text-sm text-[#9b2e39]">
          <p>{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="rounded-2xl border border-[#e4ebe8] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-[#0d4a38] text-white'
                      : 'bg-[#f3f5f4] text-[#5d726b] hover:bg-[#e8efec]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Active POs" value={String(activeOrders)} helper="Awaiting updates" />
            <MetricCard
              label="Pending Action"
              value={String(pendingActions).padStart(2, '0')}
              helper="Actionable requests"
            />
            <MetricCard
              label="Fulfillment Rate"
              value={fulfillmentRate}
              helper="Based on all tracked orders"
            />
          </section>

          <section className="mt-6 rounded-2xl border border-[#e4ebe8] bg-white p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#163a2f]">Orders Table</h2>
              <p className="text-sm text-[#6f817b]">Logged in as {user?.name}</p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-48 flex-1">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa89f]" />
                <input
                  type="search"
                  placeholder="Search by PO#, brand or item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[#dce8e3] bg-[#f4f7f6] pl-9 pr-3 text-sm text-[#5f7770] focus:outline-none"
                />
              </div>
              <select
                value={`${sortField}:${sortDir}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split(':');
                  setSortField(f); setSortDir(d); setPage(0);
                }}
                className="h-9 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] focus:outline-none"
              >
                <option value="id:desc">Newest first</option>
                <option value="id:asc">Oldest first</option>
                <option value="brand:asc">Brand A–Z</option>
                <option value="brand:desc">Brand Z–A</option>
                <option value="status:asc">Status A–Z</option>
              </select>
              <span className="text-xs text-[#6f817b]">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-[#e4ebe8] bg-[#f8fbf9] p-8 text-center text-sm text-[#6f817b]">
                {orders.length === 0 ? 'No purchase orders found for your assigned brands.' : 'No orders match your search or filter.'}
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-[#e4ebe8] md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f7f9f8] text-[11px] uppercase tracking-[0.08em] text-[#667872]">
                      <tr>
                        <SortableHeader label="Order/PO #" field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <SortableHeader label="Brand" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <th className={th}>Items</th>
                        <th className={th}>Delivery ETA</th>
                        <SortableHeader label="Status" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} className={th} />
                        <th className={th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedOrders.map((order) => (
                        <tr key={order.id} className="border-t border-[#edf2f0] align-top text-[#26443a]">
                          <td className={`${td} font-semibold`}>PO-{order.id}</td>
                          <td className={td}>{order.brandName || 'Unknown'}</td>
                          <td className={`${td} max-w-sm`}>
                            <div className="space-y-1.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  <span className="font-semibold text-[#163a2f]">
                                    {item.quantity}x {item.productName}
                                  </span>
                                  {(item.batchNumber || item.supplierExpiryDate) && (
                                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[#6f817b]">
                                      {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
                                      {item.supplierExpiryDate && <span>Exp: {item.supplierExpiryDate}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className={td}>
                            {order.status === 'COMPLETED'
                              ? 'Delivered'
                              : order.estimatedDeliveryTimeline || (
                                  <span className="italic text-[#879590]">Unscheduled</span>
                                )}
                          </td>
                          <td className={td}>
                            <StatusBadge status={order.status} />
                          </td>
                          <td className={td}>
                            <ActionButtons
                              order={order}
                              updateStatus={updateStatus}
                              fetchOrders={fetchOrders}
                              setRejectOrderId={setRejectOrderId}
                              setNoticeOrderId={setNoticeOrderId}
                              handleOpenModal={handleOpenModal}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 md:hidden">
                  {pagedOrders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-[#e4ebe8] bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-[#163a2f]">PO-{order.id}</p>
                          <p className="text-sm text-[#6f817b]">{order.brandName || 'Unknown'}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="mt-3 text-sm text-[#325247]">
                        <p className="text-xs uppercase tracking-wide text-[#6f817b]">Items</p>
                        <ul className="mt-1 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-sm">
                              {item.quantity}x {item.productName}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs uppercase tracking-wide text-[#6f817b]">Delivery ETA</p>
                        <p className="mt-1">
                          {order.status === 'COMPLETED'
                            ? 'Delivered'
                            : order.estimatedDeliveryTimeline || 'Unscheduled'}
                        </p>
                      </div>
                      <div className="mt-3">
                        <ActionButtons
                          order={order}
                          updateStatus={updateStatus}
                          fetchOrders={fetchOrders}
                          setRejectOrderId={setRejectOrderId}
                          setNoticeOrderId={setNoticeOrderId}
                          handleOpenModal={handleOpenModal}
                          compact
                        />
                      </div>
                    </article>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-[#edf2f0] pt-4">
                    <span className="text-xs text-[#6f817b]">
                      Page {page + 1} of {totalPages} &middot; {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-[#dce8e3] bg-white px-3 py-1.5 text-xs font-medium text-[#5f7770] disabled:opacity-40">Prev</button>
                      <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-[#dce8e3] bg-white px-3 py-1.5 text-xs font-medium text-[#5f7770] disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      ) : null}

      {rejectOrderId && (
        <ActionModal
          title={`Reject Order PO-${rejectOrderId}`}
          description="Please provide a reason for rejecting this order."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          confirmLabel="Reject Order"
          confirmClassName="bg-[#0d4a38] hover:bg-[#083a2c]"
          onCancel={() => {
            setRejectOrderId(null);
            setRejectionReason('');
          }}
          onConfirm={submitReject}
        />
      )}

      {noticeOrderId && (
        <ActionModal
          title="Send Notice to Retailer"
          description="Notify admin that the issue has been resolved."
          value={noticeText}
          onChange={(e) => setNoticeText(e.target.value)}
          confirmLabel="Send Notice"
          confirmClassName="bg-[#0d4a38] hover:bg-[#083a2c]"
          onCancel={() => {
            setNoticeOrderId(null);
            setNoticeText('');
          }}
          onConfirm={submitNotice}
        />
      )}

      <UpdatePurchaseOrderStatusModal
        key={selectedOrder?.id || 'none'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onUpdateSuccess={() => fetchOrders()}
      />
    </SupplierLayout>
  );
}

function SortableHeader({ label, field, sortField, sortDir, onSort, className }) {
  const active = sortField === field;
  return (
    <th className={className}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-semibold hover:text-[#0d4a38]">
        {label}
        <span className="flex flex-col text-[8px] leading-none">
          <span className={active && sortDir === 'asc' ? 'text-[#0d4a38]' : 'opacity-40'}>▲</span>
          <span className={active && sortDir === 'desc' ? 'text-[#0d4a38]' : 'opacity-40'}>▼</span>
        </span>
      </button>
    </th>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="rounded-2xl border border-[#e4ebe8] bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6f817b]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#163a2f]">{value}</p>
      <p className="mt-2 text-xs text-[#6f817b]">{helper}</p>
    </article>
  );
}

function StatusBadge({ status }) {
  if (status === 'DELIVERED' || status === 'COMPLETED') {
    return (
      <span className="inline-flex rounded-full bg-[#eaf5ef] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1c634b]">
        Delivered
      </span>
    );
  }

  if (status === 'SHIPPED') {
    return (
      <span className="inline-flex rounded-full bg-[#edf3ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#365ca4]">
        Shipped
      </span>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex rounded-full bg-[#fdecee] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c23939]">
        Cancelled
      </span>
    );
  }

  if (status === 'ACCEPTED') {
    return (
      <span className="inline-flex rounded-full bg-[#e9f6f4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1f6f63]">
        Accepted
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#f3f5f4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#5d726b]">
      Pending
    </span>
  );
}

function ActionButtons({
  order,
  updateStatus,
  fetchOrders,
  setRejectOrderId,
  setNoticeOrderId,
  handleOpenModal,
  compact = false,
}) {
  const base = compact ? 'w-full justify-center' : '';

  if (order.status === 'PENDING') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            const result = await updateStatus(order.id, { status: 'ACCEPTED' });
            if (result.success) {
              toast.success('Order Accepted!');
              fetchOrders();
            } else {
              toast.error(result.error || 'Failed to accept order');
            }
          }}
          className={`inline-flex h-8 items-center gap-1 rounded-md bg-[#0d4a38] px-3 text-xs font-semibold text-white transition hover:bg-[#083a2c] ${base}`}
        >
          <FiCheck className="h-3.5 w-3.5" />
          <span>Accept</span>
        </button>
        <button
          type="button"
          onClick={() => setRejectOrderId(order.id)}
          className={`inline-flex h-8 items-center gap-1 rounded-md border border-[#e9cdce] bg-white px-3 text-xs font-semibold text-[#b13a43] transition hover:bg-[#fff4f5] ${base}`}
        >
          <FiX className="h-3.5 w-3.5" />
          <span>Reject</span>
        </button>
      </div>
    );
  }

  if (order.status === 'CANCELLED') {
    return (
      <button
        type="button"
        onClick={() => setNoticeOrderId(order.id)}
        className={`inline-flex h-8 items-center gap-1 rounded-md border border-[#dbe4e0] bg-white px-3 text-xs font-semibold text-[#0d4a38] transition hover:bg-[#f4f8f6] ${base}`}
      >
        <FiSend className="h-3.5 w-3.5" />
        <span>Send Notice</span>
      </button>
    );
  }

  if (order.status !== 'COMPLETED') {
    return (
      <button
        type="button"
        onClick={() => handleOpenModal(order)}
        className={`inline-flex h-8 items-center rounded-md border border-[#dbe4e0] bg-white px-3 text-xs font-semibold text-[#0d4a38] transition hover:bg-[#f4f8f6] ${base}`}
      >
        Update
      </button>
    );
  }

  return <span className="text-xs text-[#6f817b]">No actions</span>;
}

function ActionModal({
  title,
  description,
  value,
  onChange,
  confirmLabel,
  confirmClassName,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-[#163a2f]">{title}</h3>
        <p className="mt-1 text-sm text-[#6f817b]">{description}</p>
        <textarea
          value={value}
          onChange={onChange}
          className="mt-4 min-h-27.5 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 py-2 text-sm text-[#26443a] outline-none focus:border-[#0d4a38]"
          placeholder="Type your message"
          autoFocus
        />
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-[#dbe4e0] px-4 text-sm font-medium text-[#3d5951] transition hover:bg-[#f4f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 rounded-lg px-4 text-sm font-semibold text-white transition ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const th = 'px-4 py-3 text-left';
const td = 'px-4 py-3';
