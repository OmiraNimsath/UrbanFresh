import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMapPin } from 'react-icons/fi';

import DeliveryOrderCard from '../../components/delivery/DeliveryOrderCard';
import DeliveryPageLayout from '../../components/delivery/DeliveryPageLayout';
import useDeliveryOrders from '../../hooks/useDeliveryOrders';
import { useAuth } from '../../context/AuthContext';
import { acceptDeliveryOrder } from '../../services/orderService';

/**
 * Delivery current orders page focused on active fulfillment operations.
 */
export default function DeliveryCurrentOrdersPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentOrders, activeOrders, loading, error, refreshOrders } = useDeliveryOrders();
  const [searchValue, setSearchValue] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [pendingAcceptOrder, setPendingAcceptOrder] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);
  const PAGE_SIZE = 8;

  const filteredCurrentOrders = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    let result = currentOrders.filter((order) => {
      if (!q) return true;
      return (
        String(order.orderId).includes(q) ||
        String(order.customerName || '').toLowerCase().includes(q)
      );
    });
    result = [...result].sort((a, b) =>
      sortDir === 'desc' ? b.orderId - a.orderId : a.orderId - b.orderId,
    );
    return result;
  }, [currentOrders, searchValue, sortDir]);

  const filteredActiveOrders = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const filtered = activeOrders.filter((order) => {
      if (!q) return true;
      return (
        String(order.orderId).includes(q) ||
        String(order.customerName || '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) =>
      sortDir === 'desc' ? b.orderId - a.orderId : a.orderId - b.orderId,
    );
  }, [activeOrders, searchValue, sortDir]);

  useEffect(() => { setPage(0); }, [searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredActiveOrders.length / PAGE_SIZE));
  const pagedOrders = filteredActiveOrders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleOpenOrder = (orderId) => {
    navigate(`/delivery/orders/${orderId}`);
  };

  const handleRefresh = async () => {
    await refreshOrders();
    toast.success('Ready orders refreshed.');
  };

  const handleOpenAcceptModal = (order) => {
    setPendingAcceptOrder(order);
  };

  const handleCancelAccept = () => {
    setPendingAcceptOrder(null);
  };

  const handleConfirmAccept = async () => {
    if (!pendingAcceptOrder?.orderId || acceptingOrderId) {
      return;
    }

    const orderId = pendingAcceptOrder.orderId;
    setAcceptingOrderId(orderId);

    try {
      await acceptDeliveryOrder(orderId);
      await refreshOrders();
      toast.success(`Order #${orderId} accepted and moved to Active Orders.`);
      setPendingAcceptOrder(null);
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      toast.error(serverMessage || 'Failed to accept order. Please try again.');
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <DeliveryPageLayout
      activeKey="orders"
      pageTitle="Newly Assigned"
      pageTitleRight={
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2c500] text-base font-semibold text-[#173f2f]">
          {Math.min(activeOrders.length, 9)}
        </span>
      }
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    >
      <section className="rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-2xl font-semibold leading-tight text-[#0d3f31] sm:text-3xl">Ready Orders</h3>
          <p className="text-sm font-medium text-[#8a9993]">{filteredCurrentOrders.length} ready order{filteredCurrentOrders.length !== 1 ? 's' : ''}</p>
        </div>

        <input
          type="text"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search by Order ID or Name"
          className="h-14 w-full rounded-2xl border border-[#d6dfdb] bg-[#eef2f0] px-5 text-base text-[#214338] outline-none transition focus:border-[#9ad3b7] focus:bg-white"
        />

        <div className="mt-4 space-y-3">
          {filteredCurrentOrders.slice(0, 2).map((order) => (
            <div key={order.orderId} className="rounded-3xl bg-[#f6f8f7] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium tracking-[0.08em] text-[#709188]">Order ID #{order.orderId}</p>
                  <p className="text-2xl font-semibold text-[#202827]">{order.customerName || 'Customer'}</p>
                  <p className="mt-1 text-base text-[#5f6f68]">{order.customerPhone || 'Phone not available'}</p>
                </div>
                <span className="rounded-full bg-[#9ee7c1] px-4 py-1 text-xs font-semibold text-[#1c6d4e]">
                  {order.priority === 'URGENT' ? 'Urgent' : 'New'}
                </span>
              </div>

              <p className="mt-4 flex items-start gap-2 text-base text-[#3f4c48]">
                <FiMapPin className="mt-1 text-[#1c8b63]" />
                <span>{order.shortDeliveryAddress || order.fullDeliveryAddress || 'Address not available'}</span>
              </p>

              <button
                type="button"
                onClick={() => handleOpenAcceptModal(order)}
                className="mt-5 h-12 w-full rounded-2xl bg-[#01412d] text-base font-semibold text-white transition hover:bg-[#083a2c]"
              >
                Accept Order
              </button>
            </div>
          ))}

          {!loading && !error && filteredCurrentOrders.length === 0 && (
            <p className="text-sm text-slate-500">No unassigned READY orders available right now.</p>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-[#e4ebe8] bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-2xl font-semibold leading-tight text-[#0d3f31] sm:text-3xl">Active Orders</h3>
          <div className="flex items-center gap-2">
            <select
              value={sortDir}
              onChange={(e) => { setSortDir(e.target.value); setPage(0); }}
              className="h-9 rounded-xl border border-[#dce8e3] bg-[#f4f7f6] px-3 text-sm text-[#5f7770] focus:outline-none"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <p className="text-sm font-medium text-[#8a9993]">{filteredActiveOrders.length} order{filteredActiveOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading orders...</p>}
        {!loading && error === 'forbidden' && <p className="mt-4 text-sm text-red-700">You are not authorized to access delivery orders.</p>}
        {!loading && error === 'failed' && <p className="mt-4 text-sm text-slate-700">Failed to load orders. Please refresh.</p>}

        {!loading && !error && filteredActiveOrders.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No active assigned orders at the moment.
          </p>
        )}

        {!loading && !error && filteredActiveOrders.length > 0 && (
          <ul className="mt-4 space-y-3">
            {pagedOrders.map((delivery) => (
              <li key={delivery.orderId}>
                <DeliveryOrderCard delivery={delivery} onOpen={handleOpenOrder} />
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-2 text-sm font-semibold transition ${
                  i === page
                    ? 'border-[#0d4a38] bg-[#0d4a38] text-white'
                    : 'border-[#dce8e3] bg-white text-[#4a6259] hover:bg-[#f1f6f4]'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce8e3] bg-white text-[#0d4a38] disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </section>

      {pendingAcceptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl sm:p-6">
            <h4 className="text-xl font-semibold text-[#173f2f]">Confirm Order Acceptance</h4>
            <p className="mt-2 text-sm text-[#52645e]">Are you sure you want to accept this order?</p>

            <div className="mt-4 space-y-2 rounded-2xl bg-[#f6f8f7] p-4 text-sm text-[#2b3f39]">
              <p><span className="font-semibold">Order ID:</span> #{pendingAcceptOrder.orderId}</p>
              <p><span className="font-semibold">Customer:</span> {pendingAcceptOrder.customerName || 'Customer'}</p>
              <p><span className="font-semibold">Address:</span> {pendingAcceptOrder.fullDeliveryAddress || pendingAcceptOrder.shortDeliveryAddress || 'Address not available'}</p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelAccept}
                disabled={!!acceptingOrderId}
                className="h-11 rounded-xl border border-[#d7e3de] px-5 text-sm font-semibold text-[#4c625b] transition hover:bg-[#f4f7f6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={acceptingOrderId === pendingAcceptOrder.orderId}
                className="h-11 rounded-xl bg-[#01412d] px-5 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptingOrderId === pendingAcceptOrder.orderId ? 'Accepting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DeliveryPageLayout>
  );
}
