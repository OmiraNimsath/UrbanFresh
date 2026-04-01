import { getDeliveryStatusBadgeClass, getDeliveryStatusLabel } from './deliveryStatusUtils';

/**
 * Badge for delivery lifecycle status values.
 */
export default function DeliveryStatusBadge({ status, className = '' }) {
  const badgeClass = getDeliveryStatusBadgeClass(status);
  const label = getDeliveryStatusLabel(status);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass} ${className}`}>
      {label}
    </span>
  );
}
