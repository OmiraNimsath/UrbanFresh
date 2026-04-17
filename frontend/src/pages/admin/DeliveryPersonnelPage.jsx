import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  createDeliveryPersonnel,
  getDeliveryPersonnelList,
  updateDeliveryPersonnelStatus,
} from '../../services/deliveryPersonnelService';
import { getAllOrders } from '../../services/orderService';
import CreateDeliveryPersonnelModal from '../../components/admin/CreateDeliveryPersonnelModal';
import AdminDeliveryLayout from '../../components/admin/delivery/AdminDeliveryLayout';
import DeliveryStatusBadge from '../../components/admin/delivery/DeliveryStatusBadge';
import DeliveryStatusTimeline from '../../components/admin/delivery/DeliveryStatusTimeline';
import DeliveryStatusConfirmModal from '../../components/admin/delivery/DeliveryStatusConfirmModal';

/**
 * Presentation Layer – Admin page for delivery personnel account management.
 */
export default function DeliveryPersonnelPage() {
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [loadingAssignedDeliveries, setLoadingAssignedDeliveries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PAGE_SIZE = 10;

  const fetchPersonnel = useCallback(async () => {
    try {
      setLoading(true);
      let page = 0;
      let hasMore = true;
      const merged = [];

      while (hasMore) {
        const { data } = await getDeliveryPersonnelList(page, 100);
        merged.push(...(data.content || []));
        hasMore = !data.last;
        page += 1;
      }

      setAllPersonnel(merged);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load delivery personnel';
      toast.error(message);
      setAllPersonnel([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const filteredPersonnel = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return allPersonnel.filter((person) => {
      const matchesSearch =
        query.length === 0 ||
        person.name?.toLowerCase().includes(query) ||
        person.phone?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && person.isActive) ||
        (statusFilter === 'inactive' && !person.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [allPersonnel, searchTerm, statusFilter]);

  const paginatedPersonnel = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredPersonnel.slice(start, start + PAGE_SIZE);
  }, [filteredPersonnel, currentPage]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(filteredPersonnel.length / PAGE_SIZE));
    setTotalPages(pages);
    setCurrentPage((prev) => Math.min(prev, pages - 1));
  }, [filteredPersonnel]);

  /**
   * Handle creation of new delivery personnel account.
   * Validates input, submits to backend, and refreshes the list.
   */
  const handleCreatePersonnel = async (formData) => {
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      };

      const { data: created } = await createDeliveryPersonnel(payload);
      if (formData.isActive === false) {
        await updateDeliveryPersonnelStatus(created.id, false);
      }
      toast.success('Delivery personnel account created successfully');
      setShowCreateModal(false);
      await fetchPersonnel();
      setCurrentPage(0);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(msg));
      } else {
        const message = err.response?.data?.message || 'Failed to create delivery personnel account';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setIsSubmitting(true);
    try {
      const newStatus = !currentStatus;
      await updateDeliveryPersonnelStatus(id, newStatus);
      const action = newStatus ? 'activated' : 'deactivated';
      toast.success(`Delivery personnel account ${action}`);
      await fetchPersonnel();
      setShowDeactivateConfirm(false);
      setShowEditModal(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update delivery personnel status';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetails = async (person) => {
    setSelectedPerson(person);
    setShowDetailPanel(true);
    setLoadingAssignedDeliveries(true);
    setAssignedDeliveries([]);

    try {
      const deliveries = await getOrdersForDeliveryPerson(person.id);
      setAssignedDeliveries(deliveries);
    } catch {
      toast.error('Failed to load assigned deliveries for this person.');
    } finally {
      setLoadingAssignedDeliveries(false);
    }
  };

  const handleEditStatus = async (formData) => {
    if (!selectedPerson) return;
    setIsSubmitting(true);
    try {
      const nextStatus = formData.isActive;
      await updateDeliveryPersonnelStatus(selectedPerson.id, nextStatus);
      toast.success(`Delivery personnel ${nextStatus ? 'activated' : 'deactivated'} successfully`);
      setShowEditModal(false);
      await fetchPersonnel();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update delivery personnel status';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timelineEntries = useMemo(() => {
    if (!selectedPerson) return [];

    const entries = [
      {
        label: 'Account created',
        description: `${selectedPerson.name} joined the delivery team.`,
        time: selectedPerson.createdAt,
      },
      ...assignedDeliveries.slice(0, 6).map((order) => ({
        label: `Assigned order #${order.orderId}`,
        description: order.deliveryPersonName ? `Assigned to ${order.deliveryPersonName}` : 'Delivery assignment updated',
        time: order.orderDate,
      })),
    ];

    return entries;
  }, [selectedPerson, assignedDeliveries]);

  const activeCount = allPersonnel.filter((person) => person.isActive).length;
  const inactiveCount = allPersonnel.length - activeCount;

  return (
    <AdminDeliveryLayout
      title="Delivery Personnel Management"
      breadcrumbCurrent="Delivery Personnel"
      breadcrumbItems={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Delivery Personnel' },
      ]}
      description="Monitor, manage, and coordinate your urban delivery fleet with operational clarity."
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-xl bg-[#0d4a38] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#083a2c]"
        >
          + Add Personnel
        </button>
      }
    >
      <DeliveryStatusConfirmModal
        isOpen={showDeactivateConfirm}
        title="Confirm Status Change"
        message={`Are you sure you want to ${selectedPerson?.isActive ? 'deactivate' : 'activate'} ${selectedPerson?.name || 'this account'}?`}
        confirmLabel={selectedPerson?.isActive ? 'Deactivate' : 'Activate'}
        intent={selectedPerson?.isActive ? 'danger' : 'success'}
        loading={isSubmitting}
        onCancel={() => setShowDeactivateConfirm(false)}
        onConfirm={() => {
          if (selectedPerson) {
            void handleToggleStatus(selectedPerson.id, selectedPerson.isActive);
          }
        }}
      />

      <DeliveryStatusConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Delivery Account"
        message="Delete operations are not available from the current API. You can deactivate the account instead."
        confirmLabel="Understood"
        intent="primary"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => setShowDeleteConfirm(false)}
      />

      {showCreateModal && (
        <CreateDeliveryPersonnelModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePersonnel}
          isSubmitting={isSubmitting}
          mode="create"
        />
      )}

      {showEditModal && selectedPerson && (
        <CreateDeliveryPersonnelModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditStatus}
          isSubmitting={isSubmitting}
          mode="edit"
          initialValues={{
            name: selectedPerson.name,
            email: selectedPerson.email,
            phone: selectedPerson.phone,
            isActive: selectedPerson.isActive,
          }}
        />
      )}

      {showDetailPanel && selectedPerson && (
        <div className="fixed inset-0 z-40 flex items-start justify-end bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedPerson.name}</h2>
                <p className="text-sm text-slate-600">Delivery personnel details and assignment history</p>
              </div>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard label="Email" value={selectedPerson.email} />
              <InfoCard label="Phone" value={selectedPerson.phone || 'Not provided'} />
              <InfoCard
                label="Status"
                value={
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${selectedPerson.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedPerson.isActive ? 'Active' : 'Inactive'}
                  </span>
                }
              />
              <InfoCard label="Created" value={formatDateTime(selectedPerson.createdAt)} />
            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assigned Deliveries</h3>
              {loadingAssignedDeliveries ? (
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-200" />
                  ))}
                </div>
              ) : assignedDeliveries.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No assigned deliveries found for this person.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className={thClass}>Order</th>
                        <th className={thClass}>Customer</th>
                        <th className={thClass}>Delivery Status</th>
                        <th className={thClass}>Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedDeliveries.map((order) => (
                        <tr key={order.orderId} className="border-t border-slate-200">
                          <td className={tdClass}>#{order.orderId}</td>
                          <td className={tdClass}>{order.customerName || 'Unknown'}</td>
                          <td className={tdClass}>
                            <DeliveryStatusBadge status={order.orderStatus} />
                          </td>
                          <td className={tdClass}>{formatDateTime(order.orderDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mt-6">
              <DeliveryStatusTimeline entries={timelineEntries} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDetailPanel(false);
                  setShowEditModal(true);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailPanel(false);
                  setShowDeactivateConfirm(true);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  selectedPerson.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedPerson.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDetailPanel(false);
                  setShowDeleteConfirm(true);
                }}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#e4ebe8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[#edf2f0] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7770]">Delivery Operations</p>
            <h2 className="mt-1 text-2xl font-bold text-[#153a30]">Fleet Members</h2>
            <p className="mt-1 text-sm text-[#6f817b]">Search by name or phone and control active assignments quickly.</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(0);
              }}
              placeholder="Search names, ID, or phone..."
              className="h-10 rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#28433b] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
              aria-label="Search delivery personnel"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(0);
              }}
              className="h-10 rounded-xl border border-[#d6e0dc] bg-[#f5f8f7] px-3 text-sm text-[#425d55] focus:border-[#0d4a38] focus:outline-none focus:ring-2 focus:ring-[#d8eae3]"
              aria-label="Filter delivery personnel by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Active Personnel" value={activeCount} tone="green" />
          <MetricCard label="Inactive Personnel" value={inactiveCount} tone="slate" />
          <MetricCard label="Total Fleet" value={allPersonnel.length} tone="mint" />
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#e4ebe8]">
          {loading ? (
            <div className="p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No delivery personnel match your current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#f5f8f7] text-xs uppercase tracking-wide text-[#7a8a85]">
                    <tr>
                      <th className={thClass}>Name</th>
                      <th className={thClass}>Email</th>
                      <th className={thClass}>Phone</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Created</th>
                      <th className={thClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPersonnel.map((person) => (
                      <tr key={person.id} className="border-t border-[#edf2f0] hover:bg-[#f8fbf9]">
                        <td className={tdClass}>
                          <button
                            type="button"
                            onClick={() => {
                              void openDetails(person);
                            }}
                            className="font-semibold text-[#1f3b32] hover:text-[#0d4a38]"
                          >
                            {person.name}
                          </button>
                        </td>
                        <td className={tdClass}>{person.email}</td>
                        <td className={tdClass}>{person.phone || 'Not provided'}</td>
                        <td className={tdClass}>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              person.isActive
                                ? 'bg-[#c8f0da] text-[#1f6a4d]'
                                : 'bg-[#e8efec] text-[#526b64]'
                            }`}
                          >
                            {person.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className={tdClass}>{formatDateTime(person.createdAt)}</td>
                        <td className={tdClass}>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPerson(person);
                                void openDetails(person);
                              }}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d5dfdb] bg-white px-3 text-xs font-semibold text-[#526b64] transition hover:bg-[#f2f7f5]"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPerson(person);
                                setShowEditModal(true);
                              }}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d5dfdb] bg-white px-3 text-xs font-semibold text-[#526b64] transition hover:bg-[#f2f7f5]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPerson(person);
                                setShowDeactivateConfirm(true);
                              }}
                              className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold text-white transition ${
                                person.isActive
                                  ? 'bg-[#c73b3b] hover:bg-[#ad2c2c]'
                                  : 'bg-[#0d4a38] hover:bg-[#083a2c]'
                              }`}
                            >
                              {person.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#edf2f0] bg-[#f8fbf9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6f817b]">
                  Page {currentPage + 1} of {totalPages} - {filteredPersonnel.length} result(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 text-sm font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="rounded-lg border border-[#d5dfdb] bg-white px-3 py-1.5 text-sm font-medium text-[#526b64] transition hover:bg-[#f2f7f5] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminDeliveryLayout>
  );
}

async function getOrdersForDeliveryPerson(deliveryPersonId) {
  let page = 0;
  let hasMore = true;
  const collected = [];

  while (hasMore) {
    const data = await getAllOrders(page, 100);
    const filtered = (data.content || []).filter((order) => order.deliveryPersonId === deliveryPersonId);
    collected.push(...filtered);
    hasMore = !data.last;
    page += 1;
  }

  return collected;
}

function MetricCard({ label, value, tone }) {
  const cardToneByKey = {
    slate: 'bg-[#f4f7f6] text-[#425d55]',
    green: 'bg-[#eaf5ef] text-[#0d4a38]',
    mint: 'bg-[#dff4e8] text-[#0d4a38]',
  };

  const valueToneByKey = {
    slate: 'text-[#334f47]',
    green: 'text-[#0d4a38]',
    mint: 'text-[#0d4a38]',
  };

  return (
    <div className={`rounded-xl border border-[#e4ebe8] px-4 py-3 ${cardToneByKey[tone] || cardToneByKey.slate}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueToneByKey[tone] || valueToneByKey.slate}`}>{value}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800">{value}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return 'Time unavailable';
  return new Date(value).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const thClass = 'px-4 py-3 text-left';
const tdClass = 'px-4 py-3 text-slate-700';
