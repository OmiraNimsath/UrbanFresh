const DELIVERY_STATUS_MAP = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-cyan-100 text-cyan-800' },
  PROCESSING: { label: 'Processing', className: 'bg-violet-100 text-violet-800' },
  READY: { label: 'Ready', className: 'bg-sky-100 text-sky-800' },
  OUT_FOR_DELIVERY: { label: 'Out For Delivery', className: 'bg-blue-100 text-blue-800' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  RETURNED: { label: 'Returned', className: 'bg-orange-100 text-orange-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-100 text-rose-800' },
};

function formatStatusLabel(status) {
  if (!status) {
    return 'Pending';
  }

  return String(status)
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export function getDeliveryStatusMeta(status) {
  return DELIVERY_STATUS_MAP[status] ?? {
    label: formatStatusLabel(status),
    className: 'bg-slate-100 text-slate-700',
  };
}

export function getDeliveryStatusLabel(status) {
  return getDeliveryStatusMeta(status).label;
}

export function getDeliveryStatusBadgeClass(status) {
  return getDeliveryStatusMeta(status).className;
}
